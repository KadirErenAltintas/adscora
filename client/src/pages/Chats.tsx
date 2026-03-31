import { useRequireAuth } from "@/_core/hooks/useRequireAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Chats() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [chatTitle, setChatTitle] = useState("");

  const { data: chats, isLoading: chatsLoading } = trpc.chats.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: stores, isLoading: storesLoading } = trpc.stores.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createChatMutation = trpc.chats.create.useMutation();

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

  const handleCreateChat = async () => {
    if (!selectedStoreId) return;

    try {
      const result = await createChatMutation.mutateAsync({
        storeId: parseInt(selectedStoreId),
        title: chatTitle || "New Chat",
      });
      setOpen(false);
      setChatTitle("");
      setSelectedStoreId("");
      // Navigate to the new chat
      if (result && "id" in result) {
        setLocation(`/chats/${result.id}`);
      }
    } catch (error) {
      console.error("Create chat error:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 lg:space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">My Chats</h1>
            <p className="text-base text-gray-400">Chat with the AI assistant about your ad strategy</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100 inline-flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Start New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store" className="text-white text-sm font-medium">Select Workspace *</Label>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger id="store" className="bg-white/5 border border-white/10 text-white">
                      <SelectValue placeholder="Select workspace" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/10">
                      {storesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : stores && stores.length > 0 ? (
                        stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()} className="text-white">
                            {store.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No workspaces
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white text-sm font-medium">Chat Title (Optional)</Label>
                  <Input
                    id="title"
                    className="bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:bg-white/10"
                    placeholder="e.g. Meta campaign strategy"
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateChat}
                  className="bg-white text-black hover:bg-gray-100 w-full"
                  disabled={!selectedStoreId || createChatMutation.isPending}
                >
                  {createChatMutation.isPending ? "Creating..." : "Start Chat"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Chats List */}
        <div>
          {chatsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white border-opacity-20"></div>
            </div>
          ) : chats && chats.length > 0 ? (
            <div className="space-y-3">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setLocation(`/chats/${chat.id}`)}
                  className="p-6 border border-white/10 rounded-lg hover:border-white/20 transition-all bg-white/5 hover:bg-white/10 group cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{chat.title || "Chat"}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(chat.createdAt).toLocaleDateString("en-US")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0 ml-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 border border-white/10 rounded-lg bg-white/5 text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg font-medium">No chats yet</p>
              <p className="text-sm text-gray-400">
                Start a new chat to discuss your ad strategy with the AI assistant.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
