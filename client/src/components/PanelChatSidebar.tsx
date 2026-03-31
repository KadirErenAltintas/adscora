import type { Chat } from "@shared/database.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Props = {
  storeId: number;
  chats: Chat[];
  selectedChatId: number | null;
  onSelectChat: (id: number) => void;
  /** Boş taslak sohbet: veritabanına yazılmadan yeni oturum */
  onNewDraft: () => void;
  /** Silinen sohbet seçiliyse üst bileşen sıfırlar */
  onDeletedChat?: (id: number) => void;
  className?: string;
};

export function PanelChatSidebar({
  storeId: _storeId,
  chats,
  selectedChatId,
  onSelectChat,
  onNewDraft,
  onDeletedChat,
  className,
}: Props) {
  const utils = trpc.useUtils();
  const deleteMut = trpc.chats.delete.useMutation({
    onSuccess: async (_, vars) => {
      await utils.chats.list.invalidate();
      onDeletedChat?.(vars.id);
    },
  });

  return (
    <div className={cn("flex h-full min-h-0 flex-col border-r border-zinc-800/90 bg-zinc-950/80", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 p-2.5 sm:p-3">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500">Chats</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-violet-400"
          title="New chat"
          onClick={onNewDraft}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-0.5 p-1.5 sm:p-2">
          {chats.length === 0 ? (
            <li className="px-2.5 py-6 text-center text-xs text-zinc-600">No saved chats yet.</li>
          ) : null}
          {chats.map((c) => {
            const active = c.id === selectedChatId;
            return (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelectChat(c.id)}
                  className={cn(
                    "flex w-full min-w-0 items-start gap-2 rounded-lg px-2.5 py-2.5 pr-10 text-left text-sm transition-colors touch-manipulation",
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium leading-snug">
                      {c.title?.trim() || "Chat"}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-zinc-600">
                      {format(new Date(c.createdAt), "d MMM yyyy")}
                    </span>
                  </span>
                </button>
                <div className="absolute right-1 top-1.5">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-zinc-500 hover:bg-red-950/50 hover:text-red-400"
                        title="Delete chat"
                        disabled={deleteMut.isPending}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                          This chat and all messages in it will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 bg-transparent">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => deleteMut.mutate({ id: c.id })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
