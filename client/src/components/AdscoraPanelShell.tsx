import { useAuth } from "@/_core/hooks/useAuth";
import { AdscoraMark } from "@/components/AdscoraLogo";
import { PanelChatSidebar } from "@/components/PanelChatSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PanelChatBridgeProvider, usePanelChatBridgeGet } from "@/contexts/PanelChatBridgeContext";
import { PanelChatUiProvider, usePanelChatSelectedId } from "@/contexts/PanelChatUiContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { BarChart3, LogOut, MessageSquare, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

export const SS_PANEL_CHAT_ID = "adscora.openPanelChatId";
export const SS_PANEL_NEW_DRAFT = "adscora.openPanelNewDraft";

function navButtonClass(active: boolean) {
  return cn(
    "flex size-11 sm:size-12 items-center justify-center rounded-xl transition-colors touch-manipulation",
    active
      ? "bg-white/10 text-violet-400/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
  );
}

function AdscoraShellLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const getBridge = usePanelChatBridgeGet();
  const sidebarSelectedId = usePanelChatSelectedId();

  const [chatSheetOpen, setChatSheetOpen] = useState(false);
  const ensureOnce = useRef(false);
  const utils = trpc.useUtils();

  const { data: stores, isFetched: storesFetched } = trpc.stores.list.useQuery(undefined, {
    enabled: !!user && !loading,
  });

  const ensureWorkspace = trpc.workspace.ensure.useMutation({
    onSuccess: () => void utils.stores.list.invalidate(),
  });

  useEffect(() => {
    if (!user || loading || !storesFetched) return;
    if ((stores?.length ?? 0) > 0) return;
    if (ensureOnce.current || ensureWorkspace.isPending) return;
    ensureOnce.current = true;
    ensureWorkspace.mutate();
  }, [user, loading, storesFetched, stores?.length, ensureWorkspace]);

  const storeId = useMemo(() => {
    if (stores && stores.length > 0) return stores[0]!.id;
    return ensureWorkspace.data?.storeId ?? null;
  }, [stores, ensureWorkspace.data?.storeId]);

  const { data: allChats = [] } = trpc.chats.list.useQuery(
    { onlyWithMessages: true },
    { enabled: !!user && !loading && storeId != null }
  );

  const workspaceChats = useMemo(() => {
    if (storeId == null) return [];
    return allChats.filter((c) => c.storeId === storeId).sort((a, b) => b.id - a.id);
  }, [allChats, storeId]);

  const goPanelSelect = useCallback(
    (id: number) => {
      const bridge = getBridge();
      if (bridge) {
        bridge.selectChat(id);
        setChatSheetOpen(false);
        return;
      }
      try {
        sessionStorage.setItem(SS_PANEL_CHAT_ID, String(id));
        sessionStorage.removeItem(SS_PANEL_NEW_DRAFT);
      } catch {
        /* ignore */
      }
      setLocation("/panel");
      setChatSheetOpen(false);
    },
    [getBridge, setLocation]
  );

  const goPanelNewDraft = useCallback(() => {
    const bridge = getBridge();
    if (bridge) {
      bridge.newDraft();
      setChatSheetOpen(false);
      return;
    }
    try {
      sessionStorage.setItem(SS_PANEL_NEW_DRAFT, "1");
      sessionStorage.removeItem(SS_PANEL_CHAT_ID);
    } catch {
      /* ignore */
    }
    setLocation("/panel");
    setChatSheetOpen(false);
  }, [getBridge, setLocation]);

  const onDeletedChat = useCallback(
    (id: number) => {
      getBridge()?.onDeletedChat?.(id);
    },
    [getBridge]
  );

  if (loading) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-black text-zinc-500"
        data-panel-theme="adscora"
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-zinc-500"
        data-panel-theme="adscora"
      >
        <p className="text-center">Authentication required.</p>
      </div>
    );
  }

  const initial =
    (user.name?.trim()?.[0] ?? user.email?.trim()?.[0] ?? "?").toUpperCase();

  const sidebar =
    storeId != null ? (
      <PanelChatSidebar
        storeId={storeId}
        chats={workspaceChats}
        selectedChatId={sidebarSelectedId}
        onSelectChat={goPanelSelect}
        onNewDraft={goPanelNewDraft}
        onDeletedChat={onDeletedChat}
      />
    ) : (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-zinc-500">
        Preparing workspace...
      </div>
    );

  return (
    <div
      className="flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-black text-zinc-100"
      data-panel-theme="adscora"
      style={{
        paddingLeft: "max(0px, env(safe-area-inset-left))",
        paddingRight: "max(0px, env(safe-area-inset-right))",
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
      }}
    >
      <Sheet open={chatSheetOpen} onOpenChange={setChatSheetOpen}>
        <SheetContent side="left" className="w-[min(20rem,88vw)] border-zinc-800 bg-zinc-950 p-0 sm:max-w-sm">
          <div className="flex h-full min-h-[100dvh] flex-col pt-10">{sidebar}</div>
        </SheetContent>
      </Sheet>

      <aside
        className="flex h-full min-h-0 w-[3.5rem] shrink-0 flex-col items-center border-r border-zinc-800/80 bg-zinc-950/95 py-3 backdrop-blur-sm sm:w-[4rem] sm:py-4"
        aria-label="Panel navigation"
      >
        <a
          href="/panel"
          className="mb-2 flex size-10 items-center justify-center rounded-xl transition-opacity hover:opacity-90 sm:mb-3 sm:size-11"
          title="Adscora — chat"
        >
          <AdscoraMark className="size-8 sm:size-9" />
        </a>

        <div className="h-px w-7 shrink-0 rounded-full bg-zinc-800/90 sm:w-8" aria-hidden />

        <div className="flex min-h-0 w-full flex-1 flex-col items-center">
          <div className="min-h-3 flex-1" aria-hidden />
          <div className="flex flex-col items-center py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                navButtonClass(false),
                "text-zinc-500 hover:text-zinc-200",
                location.startsWith("/panel") && "text-zinc-300"
              )}
              title="Chat history"
              aria-label="Chat history"
              onClick={() => setChatSheetOpen(true)}
            >
              <MessageSquare className="size-[1.35rem] sm:size-5" strokeWidth={1.75} />
            </Button>
          </div>
          <div className="min-h-2 flex-1" aria-hidden />
          <div className="flex flex-col items-center gap-1.5 pb-1">
            <a
              href="/analyses"
              className={navButtonClass(location.startsWith("/analyses"))}
              title="Analyses"
            >
              <BarChart3 className="size-[1.35rem] sm:size-5" strokeWidth={1.75} />
            </a>
            <a
              href="/settings"
              className={navButtonClass(location.startsWith("/settings"))}
              title="Settings"
            >
              <Settings className="size-[1.35rem] sm:size-5" strokeWidth={1.75} />
            </a>
          </div>
        </div>

        <div className="h-px w-7 shrink-0 rounded-full bg-zinc-800/90 sm:w-8" aria-hidden />

        <div className="mt-2 flex flex-col items-center gap-2 pt-2 sm:mt-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(navButtonClass(false), "size-11 sm:size-12")}
            title="Sign out"
            onClick={async () => {
              await logout();
              setLocation("/");
            }}
          >
            <LogOut className="size-[1.2rem] sm:size-[1.05rem]" strokeWidth={1.75} />
          </Button>
          <div
            className="flex size-9 items-center justify-center rounded-full bg-zinc-700/90 text-xs font-semibold text-white ring-1 ring-zinc-600/50 sm:size-10 sm:text-sm"
            title={user.name || user.email || "Account"}
          >
            {initial}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black">{children}</div>
    </div>
  );
}

export default function AdscoraPanelShell({ children }: { children: React.ReactNode }) {
  return (
    <PanelChatBridgeProvider>
      <PanelChatUiProvider>
        <AdscoraShellLayout>{children}</AdscoraShellLayout>
      </PanelChatUiProvider>
    </PanelChatBridgeProvider>
  );
}
