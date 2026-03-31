import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles, X, Sun } from "lucide-react";
import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Streamdown } from "streamdown";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

function panelFirstName(name: string | null | undefined, email: string | null | undefined): string {
  const n = name?.trim();
  if (n) return n.split(/\s+/)[0] ?? "siz";
  const e = email?.trim();
  if (e) return e.split("@")[0] ?? "siz";
  return "siz";
}

function panelGreetingLine(hour: number, first: string): string {
  let prefix: string;
  if (hour < 5) prefix = "Good night";
  else if (hour < 12) prefix = "Good morning";
  else if (hour < 18) prefix = "Good afternoon";
  else prefix = "Good evening";
  return `${prefix}, ${first}`;
}

function titleFromFirstMessage(text: string): string {
  const t = text.trim().replace(/^(RAPOR|REPORT):\s*/i, "").trim();
  const line = (t.split(/\n/)[0] ?? t).trim();
  const cut = line.slice(0, 52).trim();
  return cut || "Chat";
}

/** Panel: placeholder metnini yazıp silerek döndürür */
function useTypingPlaceholder(enabled: boolean): string {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!enabled) {
      setDisplay("");
      return;
    }
    const phrases = [
      "How can I help you today?",
      "Ask me about your ad performance...",
      "Tap + to connect your accounts.",
    ];
    let cancelled = false;
    const st = { p: 0, c: 0, del: false };
    let tid: ReturnType<typeof setTimeout>;

    const phraseAt = () => phrases[st.p % phrases.length];

    const schedule = (ms: number, fn: () => void) => {
      tid = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    function tick() {
      if (cancelled) return;
      const phrase = phraseAt();
      if (!st.del) {
        if (st.c < phrase.length) {
          st.c += 1;
          setDisplay(phrase.slice(0, st.c));
          schedule(38, tick);
        } else {
          schedule(2200, () => {
            st.del = true;
            tick();
          });
        }
      } else if (st.c > 0) {
        st.c -= 1;
        setDisplay(phrase.slice(0, st.c));
        schedule(26, tick);
      } else {
        st.del = false;
        st.p += 1;
        schedule(450, tick);
      }
    }

    schedule(500, tick);
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [enabled]);
  return display;
}

export type AIChatBoxViewMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  id?: number;
  /** Geçici satırlar (streaming) için sabit anahtar */
  clientKey?: string;
};

export type AIChatBoxViewProps = {
  messages: AIChatBoxViewMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
  /** Claude tarzı panel: krem zemin, serif karşılama, beyaz composer. */
  visualVariant?: "default" | "claude";
  /** `visualVariant="claude"` iken boş ekranda gösterilir. */
  claudeGreeting?: string;
  /** Composer solunda (örn. + ile entegrasyon menüsü). */
  leftComposerSlot?: ReactNode;
  /** Panel: textarea placeholder animasyonu */
  animatedPlaceholder?: boolean;
  /** Panel: öneriler dikey sıra */
  stackSuggestions?: boolean;
};

export function AIChatBoxView({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation",
  suggestedPrompts,
  visualVariant = "default",
  claudeGreeting,
  leftComposerSlot,
  animatedPlaceholder = false,
  stackSuggestions = false,
}: AIChatBoxViewProps) {
  const claude = visualVariant === "claude";
  const typewriterPh = useTypingPlaceholder(claude && animatedPlaceholder);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  const displayMessages = messages.filter((msg) => msg.role !== "system");

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;
      const userMessageReservedHeight = 56;
      const calculatedHeight = scrollAreaHeight - 32 - userMessageReservedHeight;
      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    onSendMessage(trimmedInput);
    setInput("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const promptBtnClass = claude
    ? "rounded-full border border-zinc-700/90 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    : "rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";

  const outerClass = claude
    ? "flex flex-col bg-transparent text-zinc-100 rounded-none border-0 shadow-none"
    : "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm";

  const composerBlock = (
    <>
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className={cn(
          "flex gap-1.5 sm:gap-2 items-end",
          claude ? "p-3 sm:p-3.5" : "p-3 sm:p-4 border-t bg-background/50 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        )}
      >
        {claude && leftComposerSlot}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            claude && animatedPlaceholder && !input.trim() ? typewriterPh || " " : placeholder
          }
          className={cn(
            "flex-1 max-h-32 resize-none min-h-11 sm:min-h-10 text-base sm:text-sm",
            claude &&
              "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-100 placeholder:text-zinc-500"
          )}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className={cn(
            "shrink-0",
            claude
              ? "size-10 sm:size-9 rounded-xl bg-zinc-200 text-zinc-900 hover:bg-white"
              : "h-[38px] w-[38px]"
          )}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </>
  );

  function rowKey(message: AIChatBoxViewMessage, index: number): string {
    if (message.clientKey) return message.clientKey;
    if (message.id != null) return `id-${message.id}`;
    return `idx-${index}`;
  }

  const hasStreamRow = displayMessages.some((m) => m.clientKey === "__stream__");
  const showFloatingTyping = isLoading && !hasStreamRow;

  return (
    <div ref={containerRef} className={cn(outerClass, className, "min-h-0")} style={{ height }}>
      <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full min-h-0 flex-col p-3 sm:p-4">
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-6",
                claude ? "text-zinc-500" : "text-muted-foreground"
              )}
            >
              {claude && claudeGreeting ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex w-full max-w-xl flex-col items-center gap-4 px-2 text-center"
                >
                  <Sun className="size-8 text-violet-400/90 sm:size-9" strokeWidth={1.5} />
                  <h1
                    className="text-[1.65rem] font-normal leading-tight tracking-tight text-zinc-100 sm:text-4xl"
                    style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                  >
                    {claudeGreeting}
                  </h1>
                  {emptyStateMessage?.trim() ? (
                    <p className="max-w-md text-sm text-zinc-500">{emptyStateMessage}</p>
                  ) : null}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Sparkles className="size-12 opacity-20" />
                  <p className="text-sm text-center px-2">{emptyStateMessage}</p>
                </div>
              )}
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div
                  className={cn(
                    "flex max-w-2xl justify-center gap-2 px-1",
                    stackSuggestions ? "w-full max-w-md flex-col" : "flex-wrap"
                  )}
                >
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className={promptBtnClass}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className={cn("flex flex-col space-y-4 p-3 sm:p-4", claude && "pb-2")}>
              {displayMessages.map((message, index) => {
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;
                return (
                  <motion.div
                    key={rowKey(message, index)}
                    layout={false}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end items-start" : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight ? { minHeight: `${minHeightForLastMessage}px` } : undefined
                    }
                  >
                    {message.role === "assistant" && (
                      <div
                        className={cn(
                          "size-8 shrink-0 mt-1 rounded-full flex items-center justify-center",
                          claude ? "bg-violet-500/15" : "bg-primary/10"
                        )}
                      >
                        <Sparkles className={cn("size-4", claude ? "text-violet-400/95" : "text-primary")} />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[min(100%,28rem)] sm:max-w-[80%] rounded-2xl px-4 py-2.5",
                        message.role === "user"
                          ? claude
                            ? "bg-zinc-800 text-zinc-50 ring-1 ring-zinc-700/80"
                            : "bg-primary text-primary-foreground"
                          : claude
                            ? "bg-zinc-100 text-zinc-900 shadow-md ring-1 ring-white/10"
                            : "bg-muted text-foreground"
                      )}
                    >
                      {message.role === "assistant" ? (
                        message.clientKey === "__stream__" && !(message.content?.trim()?.length ?? 0) ? (
                          <Loader2
                            className={cn(
                              "size-4 animate-spin",
                              claude ? "text-zinc-500" : "text-muted-foreground"
                            )}
                          />
                        ) : (
                          <div
                            className={cn(
                              "prose prose-sm max-w-none",
                              claude ? "prose-neutral text-zinc-900" : "dark:prose-invert"
                            )}
                          >
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div
                        className={cn(
                          "size-8 shrink-0 mt-1 rounded-full flex items-center justify-center",
                          claude ? "bg-zinc-700" : "bg-secondary"
                        )}
                      >
                        <User className={cn("size-4", claude ? "text-zinc-200" : "text-secondary-foreground")} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {showFloatingTyping && (
                <motion.div
                  key="typing-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                  style={
                    minHeightForLastMessage > 0 ? { minHeight: `${minHeightForLastMessage}px` } : undefined
                  }
                >
                  <div
                    className={cn(
                      "size-8 shrink-0 mt-1 rounded-full flex items-center justify-center",
                      claude ? "bg-violet-500/15" : "bg-primary/10"
                    )}
                  >
                    <Sparkles className={cn("size-4", claude ? "text-violet-400/95" : "text-primary")} />
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5",
                      claude ? "bg-zinc-100 ring-1 ring-white/10" : "bg-muted"
                    )}
                  >
                    <Loader2
                      className={cn("size-4 animate-spin", claude ? "text-zinc-500" : "text-muted-foreground")}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      {claude ? (
        <div className="shrink-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-3">
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800/90 bg-zinc-950/95 shadow-xl shadow-black/40 ring-1 ring-white/[0.04]">
            {composerBlock}
          </div>
        </div>
      ) : (
        composerBlock
      )}
    </div>
  );
}

export type AIChatBoxProps = {
  /** Panel: sunucudan gelen çalışma alanı mağaza kimliği (tek sohbet). */
  storeId?: number;
  variant: "full" | "sidebar";
  onClose?: () => void;
  /** Sohbet API’sine gönderilir; seçili Google hesabı bağlamı. */
  contextGoogleAdsAccountId?: number | null;
  contextMetaAdsAccountId?: number | null;
  /** `panel`: tam ekran sohbet, mağaza seçimi yok. */
  layout?: "default" | "panel";
  /** Panel: composer solundaki + menüsü (Google/Meta hub). */
  panelIntegrationSlot?: ReactNode;
  /** Panel: çoklu sohbet — seçili sohbet kimliği; null = yeni taslak (ilk mesajda oluşur). */
  panelChatId?: number | null;
  /** Panel: ilk mesajda sohbet oluşturulunca üst bileşen seçer */
  onPanelChatCreated?: (id: number) => void;
};

export function AIChatBox({
  storeId: storeIdProp,
  variant,
  onClose,
  contextGoogleAdsAccountId = null,
  contextMetaAdsAccountId = null,
  layout = "default",
  panelIntegrationSlot,
  panelChatId = null,
  onPanelChatCreated,
}: AIChatBoxProps) {
  const utils = trpc.useUtils();
  const { user: authUser } = useAuth();
  const panelClaude = layout === "panel";
  const hour = new Date().getHours();
  const claudeGreetingLine = panelClaude
    ? panelGreetingLine(hour, panelFirstName(authUser?.name, authUser?.email))
    : undefined;
  const { data: stores } = trpc.stores.list.useQuery(undefined, {
    enabled: layout !== "panel",
  });
  const [pickedStoreId, setPickedStoreId] = useState<number | undefined>(storeIdProp);

  useEffect(() => {
    setPickedStoreId(storeIdProp);
  }, [storeIdProp]);

  useEffect(() => {
    if (layout === "panel") return;
    if (pickedStoreId == null && stores && stores.length === 1) {
      setPickedStoreId(stores[0]!.id);
    }
  }, [stores, pickedStoreId, layout]);

  const initChat = trpc.aiChat.getOrCreateConsultantChat.useMutation();
  const [fallbackChatId, setFallbackChatId] = useState<number | null>(null);

  useEffect(() => {
    if (layout === "panel") {
      setFallbackChatId(null);
      return;
    }
    setFallbackChatId(null);
    if (pickedStoreId == null) return;
    initChat.mutate(
      { storeId: pickedStoreId },
      {
        onSuccess: (d) => setFallbackChatId(d.chatId),
      }
    );
  }, [pickedStoreId, layout]);

  const effectiveChatId =
    layout === "panel" && panelChatId != null && panelChatId > 0
      ? panelChatId
      : layout !== "panel"
        ? fallbackChatId
        : null;

  const { data: rawMessages = [], isLoading: messagesLoading } = trpc.messages.list.useQuery(
    { chatId: effectiveChatId ?? 0 },
    { enabled: effectiveChatId != null && effectiveChatId > 0 }
  );

  const viewMessages: AIChatBoxViewMessage[] = rawMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genReport = trpc.analyses.generateFromPrompt.useMutation();
  const createPanelChat = trpc.chats.create.useMutation();

  const sendWithStream = useCallback(
    async (chatId: number, content: string) => {
      if (!chatId) return;
      setError(null);
      setIsStreaming(true);
      setPendingUser(content);
      setStreamText("");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("No active session found");
        setIsStreaming(false);
        setPendingUser(null);
        return;
      }

      let accumulated = "";
      try {
        const res = await fetch("/api/ai-chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId,
            content,
            ...(contextGoogleAdsAccountId != null && contextGoogleAdsAccountId > 0
              ? { googleAdsAccountId: contextGoogleAdsAccountId }
              : {}),
            ...(contextMetaAdsAccountId != null && contextMetaAdsAccountId > 0
              ? { metaAdsAccountId: contextMetaAdsAccountId }
              : {}),
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || res.statusText);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("Unable to read response body");
        }

        const dec = new TextDecoder();
        let carry = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += dec.decode(value, { stream: true });
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const c = j.choices?.[0]?.delta?.content;
              if (typeof c === "string" && c.length) {
                accumulated += c;
                setStreamText(accumulated);
              }
            } catch {
              /* ignore */
            }
          }
        }

        await utils.messages.list.invalidate({ chatId });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setIsStreaming(false);
        setPendingUser(null);
        setStreamText("");
      }
    },
    [utils.messages.list, contextGoogleAdsAccountId, contextMetaAdsAccountId]
  );

  const resolveChatIdForPanel = useCallback(
    async (messageText: string): Promise<number | null> => {
      if (layout !== "panel") {
        return effectiveChatId;
      }
      if (pickedStoreId == null) return null;
      if (effectiveChatId != null && effectiveChatId > 0) return effectiveChatId;
      try {
        const { id } = await createPanelChat.mutateAsync({
          storeId: pickedStoreId,
          title: titleFromFirstMessage(messageText),
        });
        onPanelChatCreated?.(id);
        return id;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not create chat");
        return null;
      }
    },
    [
      layout,
      pickedStoreId,
      effectiveChatId,
      createPanelChat,
      onPanelChatCreated,
    ]
  );

  const handleOutgoingMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      const reportMatch = /^[\s\uFEFF]*(RAPOR|REPORT):\s*([\s\S]*)$/i.exec(trimmed);

      const chatId =
        layout === "panel" ? await resolveChatIdForPanel(trimmed) : effectiveChatId;

      if (reportMatch && pickedStoreId != null) {
        if (chatId == null || chatId <= 0) {
          toast.error("Could not start the chat. Please try again.");
          return;
        }
        const promptBody = reportMatch[2]?.trim() || "General ad performance analysis and recommendations";
        try {
          await genReport.mutateAsync({
            prompt: promptBody,
            storeId: pickedStoreId,
            chatId,
          });
          toast.success("Rapor kaydedildi", {
            action: {
              label: "Analyses",
              onClick: () => {
                window.location.href = "/analyses";
              },
            },
          });
          await utils.analyses.list.invalidate();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not generate report");
        }
        return;
      }

      if (chatId == null || chatId <= 0) return;
      await sendWithStream(chatId, content);
    },
    [
      pickedStoreId,
      effectiveChatId,
      layout,
      resolveChatIdForPanel,
      genReport,
      sendWithStream,
      utils.analyses.list,
    ]
  );

  const buildDisplay = (): AIChatBoxViewMessage[] => {
    let base = variant === "sidebar" ? viewMessages.slice(-5) : viewMessages;
    if (pendingUser != null) {
      base = [
        ...base,
        { role: "user" as const, content: pendingUser, clientKey: "__pending_user__" },
        { role: "assistant" as const, content: streamText, clientKey: "__stream__" },
      ];
    }
    if (variant === "sidebar" && base.length > 5) {
      base = base.slice(-5);
    }
    return base;
  };

  const display = buildDisplay();

  const busy =
    isStreaming ||
    genReport.isPending ||
    createPanelChat.isPending ||
    (layout !== "panel" && initChat.isPending) ||
    (effectiveChatId != null && effectiveChatId > 0 && messagesLoading) ||
    (layout !== "panel" && pickedStoreId != null && effectiveChatId == null);

  const header = panelClaude ? null : (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 shrink-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">Adscora AI</p>
        {variant === "sidebar" && (
          <Link href="/panel" className="text-xs text-emerald-500/90 hover:underline">
            Tam sohbet
          </Link>
        )}
      </div>
      {onClose && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );

  if (variant === "full" && pickedStoreId == null && layout !== "panel") {
    return (
      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-center">Adscora AI Assistant</h1>
        <p className="text-sm text-muted-foreground text-center">
          Select a workspace or create a new one to continue.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {stores?.map((s) => (
            <Button key={s.id} variant="outline" onClick={() => setPickedStoreId(s.id)}>
              {s.name}
            </Button>
          ))}
        </div>
        <Link href="/stores" className="text-center text-sm text-primary hover:underline">
          My Workspaces
        </Link>
      </div>
    );
  }

  if (layout === "panel" && pickedStoreId == null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-stone-500">
        Loading chat...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col",
        variant === "full" && layout === "panel"
          ? "mx-auto h-full max-h-full min-h-0 w-full max-w-3xl flex-1 overflow-hidden px-2 sm:px-4"
          : variant === "full"
            ? "h-[min(720px,calc(100vh-8rem))] max-w-4xl mx-auto"
            : "h-full w-full"
      )}
    >
      {variant === "full" && layout !== "panel" && (
        <h1 className="text-2xl font-bold mb-4 text-center shrink-0">Adscora AI Assistant</h1>
      )}
      {header}
      {error && (
        <p
          className={cn(
            "text-sm px-3 py-1.5 shrink-0",
            panelClaude ? "text-red-300 bg-red-950/50 border border-red-900/40 rounded-lg mx-2" : "text-destructive"
          )}
          role="alert"
        >
          {error}
        </p>
      )}
      <AIChatBoxView
        messages={display}
        onSendMessage={(c) => void handleOutgoingMessage(c)}
        isLoading={busy}
        placeholder={
          panelClaude
            ? "Type your message..."
            : "Ask your question... For visual reports use: REPORT: ..."
        }
        height={variant === "full" ? (layout === "panel" ? "100%" : "100%") : "calc(100% - 52px)"}
        className={cn(
          "flex-1 min-h-0",
          panelClaude ? "border-0 rounded-none shadow-none" : "border-0 rounded-none shadow-none rounded-b-lg sm:rounded-lg"
        )}
        emptyStateMessage={panelClaude ? "" : "Start a conversation"}
        suggestedPrompts={
          variant === "full"
            ? layout === "panel"
              ? [
                  "Summarize my ad performance this week",
                  "How can I improve spending efficiency?",
                  "Where should I start if conversions are dropping?",
                ]
              : [
                  "How should I interpret ROAS in the last 30 days?",
                  "How should I split budget between Google and Meta?",
                  "What should I check first when CTR is low?",
                ]
            : undefined
        }
        visualVariant={panelClaude ? "claude" : "default"}
        claudeGreeting={claudeGreetingLine}
        leftComposerSlot={panelClaude ? panelIntegrationSlot : undefined}
        animatedPlaceholder={panelClaude}
        stackSuggestions={panelClaude}
      />
    </div>
  );
}
