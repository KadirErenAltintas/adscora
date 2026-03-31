import { TRPCError } from "@trpc/server";
import {
  getAdPlatformActionByIdForUser,
  getGoogleAdsAccountForUser,
  getMetaAdsAccountForUser,
  insertAdPlatformActionRow,
  listAdPlatformActionsForUser,
  updateAdPlatformActionRow,
} from "../db";
import { googleAdsService } from "../integrations/google-ads";
import { googleMutateCampaignStatus, googleRefreshAccessToken } from "../integrations/google-ads-oauth";
import { MetaAdsService } from "../integrations/meta-ads";

function mapGoogleStatus(s: string | number | undefined): "PAUSED" | "ENABLED" {
  if (s === 3 || s === "3") return "PAUSED";
  const u = String(s ?? "").toUpperCase();
  if (u === "PAUSED") return "PAUSED";
  return "ENABLED";
}

function mapMetaStatus(s: string | undefined): "PAUSED" | "ACTIVE" {
  const u = String(s ?? "").toUpperCase();
  if (u === "PAUSED" || u === "ARCHIVED") return "PAUSED";
  return "ACTIVE";
}

export const adPlatformActionsService = {
  async list(userId: number, storeId?: number) {
    return listAdPlatformActionsForUser(userId, { storeId, limit: 80 });
  },

  async proposeGooglePauseCampaign(input: {
    userId: number;
    storeId: number | null;
    googleAdsAccountId: number;
    campaignId: string;
  }) {
    const acc = await getGoogleAdsAccountForUser(input.googleAdsAccountId, input.userId);
    if (!acc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Google Ads account not found" });
    }
    const rt = acc.refreshToken?.trim();
    if (!rt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Missing refresh token; reconnect this account" });
    }
    if (!googleAdsService.isConfigured()) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Google Ads API is not configured" });
    }

    const row = await googleAdsService.getCampaignById(acc.customerId, rt, input.campaignId);
    const st = row?.campaign?.status;
    const mapped = mapGoogleStatus(
      typeof st === "string" || typeof st === "number" ? st : undefined
    );

    if (mapped === "PAUSED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign is already paused" });
    }

    const name = row?.campaign?.name ?? `Campaign ${input.campaignId}`;
    const id = await insertAdPlatformActionRow({
      userId: input.userId,
      storeId: input.storeId ?? acc.storeId,
      platform: "google",
      googleAdsAccountId: acc.id,
      status: "pending_approval",
      actionType: "campaign_pause",
      summaryTr: `Google Ads: "${name}" will be paused`,
      detailTr: `Campaign ID: ${input.campaignId}. After approval, status is set to PAUSED; you can revert to restore previous status.`,
      payloadBefore: { status: mapped, campaignId: input.campaignId, campaignName: name },
      revertPayload: { status: mapped, campaignId: input.campaignId },
      externalResource: `google:campaign:${acc.customerId}:${input.campaignId}`,
    });
    return { actionId: id };
  },

  async proposeMetaPauseCampaign(input: {
    userId: number;
    storeId: number | null;
    metaAdsAccountId: number;
    campaignId: string;
  }) {
    const acc = await getMetaAdsAccountForUser(input.metaAdsAccountId, input.userId);
    if (!acc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Meta account not found" });
    }
    const svc = new MetaAdsService(acc.accessToken);
    const camp = await svc.getCampaignById(input.campaignId);
    const mapped = mapMetaStatus(camp.status);

    if (mapped === "PAUSED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Campaign is already paused" });
    }

    const name = camp.name ?? `Campaign ${input.campaignId}`;
    const id = await insertAdPlatformActionRow({
      userId: input.userId,
      storeId: input.storeId ?? acc.storeId,
      platform: "meta",
      metaAdsAccountId: acc.id,
      status: "pending_approval",
      actionType: "campaign_pause",
      summaryTr: `Meta: "${name}" will be paused`,
      detailTr: `Campaign ID: ${input.campaignId}. You can revert to restore ACTIVE status.`,
      payloadBefore: { status: mapped, campaignId: input.campaignId, campaignName: name },
      revertPayload: { status: mapped, campaignId: input.campaignId },
      externalResource: `meta:campaign:${input.campaignId}`,
    });
    return { actionId: id };
  },

  async approve(userId: number, actionId: number) {
    const act = await getAdPlatformActionByIdForUser(actionId, userId);
    if (!act) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Action not found" });
    }
    if (act.status !== "pending_approval") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This action is not pending approval" });
    }

    if (act.platform === "google" && act.actionType === "campaign_pause") {
      const acc = act.googleAdsAccountId
        ? await getGoogleAdsAccountForUser(act.googleAdsAccountId, userId)
        : undefined;
      if (!acc?.refreshToken?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Google refresh token is missing" });
      }
      const before = act.payloadBefore as { campaignId?: string; status?: string };
      const cid = before?.campaignId;
      if (!cid) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing campaign data" });

      try {
        const access = await googleRefreshAccessToken(acc.refreshToken.trim());
        await googleMutateCampaignStatus({
          customerId: acc.customerId,
          accessToken: access,
          campaignId: cid,
          status: "PAUSED",
        });
        await updateAdPlatformActionRow(actionId, userId, {
          status: "applied",
          payloadAfter: { status: "PAUSED", campaignId: cid },
          appliedAt: new Date(),
          errorMessage: null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateAdPlatformActionRow(actionId, userId, {
          status: "failed",
          errorMessage: msg,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
      return { ok: true as const };
    }

    if (act.platform === "meta" && act.actionType === "campaign_pause") {
      const acc = act.metaAdsAccountId
        ? await getMetaAdsAccountForUser(act.metaAdsAccountId, userId)
        : undefined;
      if (!acc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta account not found" });
      }
      const before = act.payloadBefore as { campaignId?: string };
      const campId = before?.campaignId;
      if (!campId) throw new TRPCError({ code: "BAD_REQUEST", message: "Missing campaign data" });

      try {
        const svc = new MetaAdsService(acc.accessToken);
        await svc.updateCampaignStatus(campId, "PAUSED");
        await updateAdPlatformActionRow(actionId, userId, {
          status: "applied",
          payloadAfter: { status: "PAUSED", campaignId: campId },
          appliedAt: new Date(),
          errorMessage: null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await updateAdPlatformActionRow(actionId, userId, {
          status: "failed",
          errorMessage: msg,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
      return { ok: true as const };
    }

    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "This action type is not implemented yet" });
  },

  async revert(userId: number, actionId: number) {
    const act = await getAdPlatformActionByIdForUser(actionId, userId);
    if (!act) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Action not found" });
    }
    if (act.status !== "applied") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only applied actions can be reverted" });
    }
    if (act.revertedAt) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Action is already reverted" });
    }

    const rev = act.revertPayload as { status?: string; campaignId?: string } | null;
    const campaignId = rev?.campaignId;
    if (!campaignId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Missing revert payload" });
    }

    if (act.platform === "google") {
      const prev = mapGoogleStatus(rev?.status);
      const acc = act.googleAdsAccountId
        ? await getGoogleAdsAccountForUser(act.googleAdsAccountId, userId)
        : undefined;
      if (!acc?.refreshToken?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Google refresh token is missing" });
      }
      try {
        const access = await googleRefreshAccessToken(acc.refreshToken.trim());
        await googleMutateCampaignStatus({
          customerId: acc.customerId,
          accessToken: access,
          campaignId,
          status: prev,
        });
        await updateAdPlatformActionRow(actionId, userId, {
          status: "reverted",
          revertedAt: new Date(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
      return { ok: true as const };
    }

    if (act.platform === "meta") {
      const prev = mapMetaStatus(rev?.status);
      const metaStatus = prev === "PAUSED" ? "PAUSED" : "ACTIVE";
      const acc = act.metaAdsAccountId
        ? await getMetaAdsAccountForUser(act.metaAdsAccountId, userId)
        : undefined;
      if (!acc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meta account not found" });
      }
      try {
        const svc = new MetaAdsService(acc.accessToken);
        await svc.updateCampaignStatus(campaignId, metaStatus);
        await updateAdPlatformActionRow(actionId, userId, {
          status: "reverted",
          revertedAt: new Date(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
      return { ok: true as const };
    }

    throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Revert is not implemented for this platform" });
  },

  async discard(userId: number, actionId: number) {
    const act = await getAdPlatformActionByIdForUser(actionId, userId);
    if (!act) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Action not found" });
    }
    if (act.status !== "pending_approval") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending suggestions can be discarded" });
    }
    await updateAdPlatformActionRow(actionId, userId, {
      status: "failed",
      errorMessage: "Cancelled by user",
    });
    return { ok: true as const };
  },
};
