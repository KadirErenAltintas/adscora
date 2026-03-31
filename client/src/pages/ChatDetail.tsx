import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation, useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { ArrowUp, Loader2, ChevronLeft, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ChatDetail() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/chats/:chatId");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = params?.chatId ? parseInt(params.chatId) : null;

  const { data: chat } = trpc.chats.get.useQuery(
    { id: chatId || 0 },
    { enabled: isAuthenticated && !!chatId }
  );

  const { data: chatMessages } = trpc.messages.list.useQuery(
    { chatId: chatId || 0 },
    { enabled: isAuthenticated && !!chatId }
  );

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!match || !chatId) {
    return (
      <DashboardLayout>
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chat Not Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Please select a valid chat.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    try {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          chatId,
          role: "user",
          content: userMessage,
          createdAt: new Date(),
        },
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            chatId,
            role: "assistant",
            content: "This is a demo response. Replace this with your AI integration.",
            createdAt: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Send message error:", error);
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <button
            onClick={() => setLocation("/chats")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="text-center">
            <h1 className="font-semibold">{chat?.title || "Chat"}</h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Start the Chat</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask questions about your ad strategy and get guidance from the AI assistant.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`message-bubble ${
                    message.role === "user" ? "message-user" : "message-assistant"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.role === "user" 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="message-bubble message-assistant flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex gap-3 pt-4 border-t border-border">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn btn-primary px-4 flex items-center justify-center"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
