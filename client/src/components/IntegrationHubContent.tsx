import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LS_GOOGLE = "adscora_ctx_google";
const LS_META = "adscora_ctx_meta";

export type IntegrationHubProps = {
  workspaceStoreId: number;
  selectedGoogleAdsAccountId: number | null;
  selectedMetaAdsAccountId: number | null;
  onSelectGoogle: (id: number | null) => void;
  onSelectMeta: (id: number | null) => void;
  /** Compact mode for panel popover */
  compact?: boolean;
};

function campaignRowId(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  const r = row as { campaign?: { id?: string | number }; campaign_id?: string };
  const id = r.campaign?.id ?? r.campaign_id;
  if (id == null) return null;
  return String(id);
}

function campaignRowName(row: unknown): string {
  if (!row || typeof row !== "object") return "Campaign";
  const r = row as { campaign?: { name?: string }; campaign_name?: string };
  return r.campaign?.name ?? r.campaign_name ?? "Campaign";
}

export function IntegrationHubContent({
  workspaceStoreId,
  selectedGoogleAdsAccountId,
  selectedMetaAdsAccountId,
  onSelectGoogle,
  onSelectMeta,
  compact = false,
}: IntegrationHubProps) {
  const { data: conn } = trpc.connections.summary.useQuery();

  useEffect(() => {
    const g = localStorage.getItem(LS_GOOGLE);
    const m = localStorage.getItem(LS_META);
    if (g && !Number.isNaN(Number(g))) onSelectGoogle(Number(g));
    if (m && !Number.isNaN(Number(m))) onSelectMeta(Number(m));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const persistGoogle = (v: string) => {
    if (!v || v === "none") {
      onSelectGoogle(null);
      localStorage.removeItem(LS_GOOGLE);
      return;
    }
    const n = Number(v);
    onSelectGoogle(n);
    localStorage.setItem(LS_GOOGLE, String(n));
  };

  const persistMeta = (v: string) => {
    if (!v || v === "none") {
      onSelectMeta(null);
      localStorage.removeItem(LS_META);
      return;
    }
    const n = Number(v);
    onSelectMeta(n);
    localStorage.setItem(LS_META, String(n));
  };

  const googleOAuth = trpc.googleAds.getOAuthAuthorizationUrl.useMutation();
  const metaOAuth = trpc.metaAds.getOAuthAuthorizationUrl.useMutation();

  const gAccId = selectedGoogleAdsAccountId ?? 0;
  const mAccId = selectedMetaAdsAccountId ?? 0;

  const { data: googleCampaigns, isLoading: gCampLoading } = trpc.googleAds.getCampaigns.useQuery(
    { accountId: gAccId },
    { enabled: gAccId > 0 }
  );
  const { data: metaCampaigns, isLoading: mCampLoading } = trpc.metaAds.getCampaigns.useQuery(
    { accountId: mAccId },
    { enabled: mAccId > 0 }
  );

  const googleCampaignList = Array.isArray(googleCampaigns) ? googleCampaigns : [];
  const metaCampaignList = Array.isArray(metaCampaigns)
    ? (metaCampaigns as Array<{ id?: string; name?: string }>)
    : [];

  const [gCamp, setGCamp] = useState("");
  const [mCamp, setMCamp] = useState("");

  const proposeGoogle = trpc.adActions.proposeGooglePause.useMutation();
  const proposeMeta = trpc.adActions.proposeMetaPause.useMutation();
  const approveAct = trpc.adActions.approve.useMutation();
  const revertAct = trpc.adActions.revert.useMutation();
  const discardAct = trpc.adActions.discard.useMutation();

  const { data: actions, refetch: refetchActions } = trpc.adActions.list.useQuery({
    storeId: workspaceStoreId,
  });

  const pending = (actions ?? []).filter((a) => a.status === "pending_approval");
  const applied = (actions ?? []).filter((a) => a.status === "applied");

  async function startGoogleOAuth() {
    try {
      const { url } = await googleOAuth.mutateAsync({ storeId: workspaceStoreId });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google OAuth failed");
    }
  }

  async function startMetaOAuth() {
    try {
      const { url } = await metaOAuth.mutateAsync({ storeId: workspaceStoreId });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Meta OAuth failed");
    }
  }

  const labelMain = compact ? "text-xs text-zinc-400" : "text-xs text-stone-700";
  const triggerMain = compact
    ? "h-9 text-xs border-zinc-700 bg-zinc-900/90 text-zinc-100"
    : "h-9 text-xs bg-white";
  const advLabel = compact ? "text-[10px] text-zinc-500" : "text-[10px] text-stone-500";
  const advTrigger = compact
    ? "h-8 text-xs border-zinc-600 bg-zinc-900 text-zinc-100"
    : "h-8 text-xs bg-white";
  const rowText = compact ? "text-xs text-zinc-300" : "text-xs text-stone-800";
  const mutedUpper = compact ? "text-[10px] uppercase tracking-wide text-zinc-500" : "text-[10px] uppercase tracking-wide text-stone-500";

  const advancedInner = (
    <>
      {!compact ? (
        <p className="text-xs font-medium text-stone-800">Panel actions (approval required)</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className={advLabel}>Google - pause campaign</Label>
          <Select value={gCamp} onValueChange={setGCamp} disabled={!gAccId || gCampLoading}>
            <SelectTrigger className={advTrigger}>
              <SelectValue placeholder={gCampLoading ? "..." : "Campaign"} />
            </SelectTrigger>
            <SelectContent>
              {googleCampaignList.map((row) => {
                const id = campaignRowId(row);
                if (!id) return null;
                return (
                  <SelectItem key={id} value={id}>
                    {campaignRowName(row)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "w-full h-8 text-xs",
              compact && "border-zinc-600 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
            )}
            disabled={!gAccId || !gCamp || proposeGoogle.isPending}
            onClick={() =>
              proposeGoogle.mutate(
                {
                  googleAdsAccountId: gAccId,
                  campaignId: gCamp,
                  storeId: workspaceStoreId,
                },
                {
                  onSuccess: () => {
                    toast.message("Suggestion created - approve it below.");
                    void refetchActions();
                  },
                  onError: (e) => toast.error(e.message),
                }
              )
            }
          >
            Suggest
          </Button>
        </div>
        <div className="space-y-1">
          <Label className={advLabel}>Meta - pause campaign</Label>
          <Select value={mCamp} onValueChange={setMCamp} disabled={!mAccId || mCampLoading}>
            <SelectTrigger className={advTrigger}>
              <SelectValue placeholder={mCampLoading ? "..." : "Campaign"} />
            </SelectTrigger>
            <SelectContent>
              {metaCampaignList.map((r) =>
                r.id ? (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name ?? r.id}
                  </SelectItem>
                ) : null
              )}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "w-full h-8 text-xs",
              compact && "border-zinc-600 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
            )}
            disabled={!mAccId || !mCamp || proposeMeta.isPending}
            onClick={() =>
              proposeMeta.mutate(
                {
                  metaAdsAccountId: mAccId,
                  campaignId: mCamp,
                  storeId: workspaceStoreId,
                },
                {
                  onSuccess: () => {
                    toast.message("Suggestion created - approve it below.");
                    void refetchActions();
                  },
                  onError: (e) => toast.error(e.message),
                }
              )
            }
          >
            Suggest
          </Button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className={mutedUpper}>Pending approval</p>
          {pending.map((a) => (
            <div key={a.id} className={cn("flex flex-wrap items-center justify-between gap-2", rowText)}>
              <span className="min-w-0 flex-1">{a.summaryTr}</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() =>
                    approveAct.mutate(
                      { id: a.id },
                      {
                        onSuccess: () => {
                          toast.success("Applied");
                          void refetchActions();
                        },
                        onError: (e) => toast.error(e.message),
                      }
                    )
                  }
                  disabled={approveAct.isPending}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px]"
                  onClick={() =>
                    discardAct.mutate(
                      { id: a.id },
                      { onSuccess: () => void refetchActions(), onError: (e) => toast.error(e.message) }
                    )
                  }
                  disabled={discardAct.isPending}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {applied.length > 0 && (
        <div className="space-y-2">
          <p className={mutedUpper}>Revert available</p>
          {applied.map((a) => (
            <div key={a.id} className={cn("flex flex-wrap items-center justify-between gap-2", rowText)}>
              <span className="min-w-0 flex-1">{a.summaryTr}</span>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-[10px]"
                onClick={() =>
                  revertAct.mutate(
                    { id: a.id },
                    {
                      onSuccess: () => {
                        toast.success("Reverted");
                        void refetchActions();
                      },
                      onError: (e) => toast.error(e.message),
                    }
                  )
                }
                disabled={revertAct.isPending}
              >
                Revert
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "space-y-4 overflow-y-auto pr-1",
        compact ? "max-h-[min(72vh,520px)]" : "max-h-[min(70vh,520px)]"
      )}
    >
      {compact ? (
        <p className="text-xs text-zinc-500">Connect accounts and choose the default chat context.</p>
      ) : (
        <p className="text-xs text-stone-500">
          Choose which account should be used as chat context. If you have multiple accounts, select one from the
          list; action suggestions are generated for the selected account.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className={labelMain}>Google Ads</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={compact ? "secondary" : "default"}
              className={cn(compact && "bg-zinc-100 text-zinc-900 hover:bg-white")}
              onClick={() => void startGoogleOAuth()}
              disabled={googleOAuth.isPending}
            >
              {googleOAuth.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Connect
            </Button>
          </div>
          <Select
            value={selectedGoogleAdsAccountId != null ? String(selectedGoogleAdsAccountId) : "none"}
            onValueChange={persistGoogle}
          >
            <SelectTrigger className={triggerMain}>
              <SelectValue placeholder={compact ? "Account" : "Select account (chat context)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All / auto</SelectItem>
              {(conn?.google ?? []).map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  Customer {g.customerId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={labelMain}>Meta Ads</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={compact ? "outline" : "secondary"}
              className={cn(
                compact &&
                  "border-zinc-600 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
              )}
              onClick={() => void startMetaOAuth()}
              disabled={metaOAuth.isPending}
            >
              {metaOAuth.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Connect
            </Button>
          </div>
          <Select
            value={selectedMetaAdsAccountId != null ? String(selectedMetaAdsAccountId) : "none"}
            onValueChange={persistMeta}
          >
            <SelectTrigger className={triggerMain}>
              <SelectValue placeholder={compact ? "Account" : "Select account (chat context)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All / auto</SelectItem>
              {(conn?.meta ?? []).map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.adAccountId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {compact ? (
        <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 [&_summary::-webkit-details-marker]:hidden">
          <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-zinc-400 select-none">
            Advanced - campaigns and approvals
          </summary>
          <div className="space-y-3 border-t border-zinc-800 p-3">{advancedInner}</div>
        </details>
      ) : (
        <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/80 p-3">{advancedInner}</div>
      )}
    </div>
  );
}
