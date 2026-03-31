import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import AdscoraPanelShell, {
  SS_PANEL_CHAT_ID,
  SS_PANEL_NEW_DRAFT,
} from "@/components/AdscoraPanelShell";
import { AIChatBox } from "@/components/AIChatBox";
import { IntegrationHubPopover } from "@/components/IntegrationHubPopover";
import { usePanelChatBridgeRegister } from "@/contexts/PanelChatBridgeContext";
import { useSyncPanelChatSelection } from "@/contexts/PanelChatUiContext";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Bridge + UI context providers are available inside the shell */
function PanelAuthenticated() {
  const utils = trpc.useUtils();
  const registerPanelBridge = usePanelChatBridgeRegister();

  const ensure = trpc.workspace.ensure.useMutation();
  const workspaceRequested = useRef(false);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [googleCtx, setGoogleCtx] = useState<number | null>(null);
  const [metaCtx, setMetaCtx] = useState<number | null>(null);
  /** null = unsaved new draft chat (created on first message) */
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  useEffect(() => {
    if (workspaceRequested.current) return;
    workspaceRequested.current = true;
    ensure.mutate(undefined, {
      onSuccess: (d) => {
        setStoreId(d.storeId);
      },
      onError: (e) => {
        workspaceRequested.current = false;
        toast.error(e.message);
      },
    });
  }, [ensure]);

  useSyncPanelChatSelection(selectedChatId);

  useEffect(() => {
    registerPanelBridge({
      selectChat: (id) => setSelectedChatId(id),
      newDraft: () => setSelectedChatId(null),
      onDeletedChat: (id) => setSelectedChatId((cur) => (cur === id ? null : cur)),
    });
    return () => registerPanelBridge(null);
  }, [registerPanelBridge]);

  useEffect(() => {
    if (storeId == null) return;
    let cid: string | null = null;
    let nd: string | null = null;
    try {
      cid = sessionStorage.getItem(SS_PANEL_CHAT_ID);
      nd = sessionStorage.getItem(SS_PANEL_NEW_DRAFT);
      sessionStorage.removeItem(SS_PANEL_CHAT_ID);
      sessionStorage.removeItem(SS_PANEL_NEW_DRAFT);
    } catch {
      /* ignore */
    }
    if (nd === "1") setSelectedChatId(null);
    if (cid && !Number.isNaN(Number(cid))) setSelectedChatId(Number(cid));
  }, [storeId]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get("google");
    const m = p.get("meta");
    if (g === "ok") {
      toast.success(`Google Ads: connected ${p.get("count") ?? "?"} account(s).`);
      window.history.replaceState({}, "", "/panel");
      void utils.connections.summary.invalidate();
    } else if (g === "error") {
      toast.error(`Google: ${p.get("reason") ?? p.get("hint") ?? "error"}`);
      window.history.replaceState({}, "", "/panel");
    }
    if (m === "ok") {
      toast.success(`Meta: connected ${p.get("count") ?? "?"} account(s).`);
      window.history.replaceState({}, "", "/panel");
      void utils.connections.summary.invalidate();
    } else if (m === "error") {
      toast.error(`Meta: ${p.get("reason") ?? "error"}`);
      window.history.replaceState({}, "", "/panel");
    }
  }, [utils.connections.summary]);

  const handlePanelChatCreated = useCallback(
    (id: number) => {
      setSelectedChatId(id);
      void utils.chats.list.invalidate();
    },
    [utils.chats.list]
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-1 pt-2 pb-2 sm:px-2 sm:pt-3">
        {storeId != null ? (
          <AIChatBox
            variant="full"
            layout="panel"
            storeId={storeId}
            panelChatId={selectedChatId}
            onPanelChatCreated={handlePanelChatCreated}
            contextGoogleAdsAccountId={googleCtx}
            contextMetaAdsAccountId={metaCtx}
            panelIntegrationSlot={
              <IntegrationHubPopover
                workspaceStoreId={storeId}
                selectedGoogleAdsAccountId={googleCtx}
                selectedMetaAdsAccountId={metaCtx}
                onSelectGoogle={setGoogleCtx}
                onSelectMeta={setMetaCtx}
              />
            }
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            {ensure.isPending ? "Preparing workspace..." : "Could not initialize workspace. Please refresh."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Panel() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth({ redirectTo: "/login" });

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdscoraPanelShell>
      <PanelAuthenticated />
    </AdscoraPanelShell>
  );
}
