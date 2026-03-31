import type { Express, Request, Response } from "express";
import { ENV } from "../_core/env";
import {
  exchangeGoogleAuthorizationCode,
  listGoogleAdsCustomerIds,
} from "../integrations/google-ads-oauth";
import {
  exchangeMetaAuthorizationCode,
  listMetaAdAccounts,
  metaLongLivedUserToken,
} from "../integrations/meta-oauth";
import {
  getStoreById,
  getUserById,
  upsertGoogleAdsAccountRow,
  upsertMetaAdsAccountRow,
} from "../db";
import { verifyGoogleAdsOAuthState, verifyMetaAdsOAuthState } from "../lib/oauth-state";
import { scheduleSixHourJob } from "../services/analysis-scheduler";
import { autoAnalysisService } from "../services/auto-analysis";

function redirectWithQuery(res: Response, path: string, q: Record<string, string>) {
  const u = new URL(path, ENV.publicAppUrl);
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
  res.redirect(u.pathname + u.search);
}

/** Main panel landing after OAuth callback. */
const OAUTH_LANDING = "/panel";

export function registerOAuthRoutes(app: Express): void {
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const err = typeof req.query.error === "string" ? req.query.error : "";

    if (err) {
      redirectWithQuery(res, OAUTH_LANDING, { google: "error", reason: err });
      return;
    }
    if (!code || !state) {
      redirectWithQuery(res, OAUTH_LANDING, { google: "error", reason: "missing_params" });
      return;
    }

    try {
      const { userId, storeId: sidRaw } = await verifyGoogleAdsOAuthState(state);
      const user = await getUserById(userId);
      if (!user) {
        redirectWithQuery(res, OAUTH_LANDING, { google: "error", reason: "user" });
        return;
      }

      let storeId: number | null = sidRaw;
      if (storeId != null) {
        const st = await getStoreById(storeId, userId);
        if (!st) storeId = null;
      }

      const tokens = await exchangeGoogleAuthorizationCode(code);
      const refresh = tokens.refresh_token;
      if (!refresh) {
        redirectWithQuery(res, OAUTH_LANDING, {
          google: "error",
          reason: "no_refresh",
          hint: "Re-authorize the Google account with offline access.",
        });
        return;
      }

      const customers = await listGoogleAdsCustomerIds(tokens.access_token);
      if (customers.length === 0) {
        redirectWithQuery(res, OAUTH_LANDING, { google: "error", reason: "no_customers" });
        return;
      }

      for (const customerId of customers) {
        const accountId = await upsertGoogleAdsAccountRow({
          userId,
          storeId,
          customerId,
          refreshToken: refresh,
        });
        if (storeId != null) {
          scheduleSixHourJob(`google-oauth-${storeId}-${accountId}`, () =>
            autoAnalysisService.analyzeStore(storeId!, userId)
          );
        }
      }

      redirectWithQuery(res, OAUTH_LANDING, {
        google: "ok",
        count: String(customers.length),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "oauth_failed";
      redirectWithQuery(res, OAUTH_LANDING, { google: "error", reason: msg.slice(0, 200) });
    }
  });

  app.get("/api/oauth/meta/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const err = typeof req.query.error === "string" ? req.query.error : "";

    if (err) {
      redirectWithQuery(res, OAUTH_LANDING, { meta: "error", reason: err });
      return;
    }
    if (!code || !state) {
      redirectWithQuery(res, OAUTH_LANDING, { meta: "error", reason: "missing_params" });
      return;
    }

    try {
      const { userId, storeId: sidRaw } = await verifyMetaAdsOAuthState(state);
      const user = await getUserById(userId);
      if (!user) {
        redirectWithQuery(res, OAUTH_LANDING, { meta: "error", reason: "user" });
        return;
      }

      let storeId: number | null = sidRaw;
      if (storeId != null) {
        const st = await getStoreById(storeId, userId);
        if (!st) storeId = null;
      }

      const shortTok = await exchangeMetaAuthorizationCode(code);
      let access = shortTok.access_token;
      try {
        access = await metaLongLivedUserToken(access);
      } catch {
        /* continue with short-lived token */
      }

      const accounts = await listMetaAdAccounts(access);
      if (accounts.length === 0) {
        redirectWithQuery(res, OAUTH_LANDING, { meta: "error", reason: "no_ad_accounts" });
        return;
      }

      for (const a of accounts) {
        const accountId = await upsertMetaAdsAccountRow({
          userId,
          storeId,
          adAccountId: a.id,
          accessToken: access,
        });
        if (storeId != null) {
          scheduleSixHourJob(`meta-oauth-${storeId}-${accountId}`, () =>
            autoAnalysisService.analyzeStore(storeId!, userId)
          );
        }
      }

      redirectWithQuery(res, OAUTH_LANDING, {
        meta: "ok",
        count: String(accounts.length),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "oauth_failed";
      redirectWithQuery(res, OAUTH_LANDING, { meta: "error", reason: msg.slice(0, 200) });
    }
  });
}
