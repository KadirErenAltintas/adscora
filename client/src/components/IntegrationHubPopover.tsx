import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IntegrationHubContent, type IntegrationHubProps } from "@/components/IntegrationHubContent";
import { Plus } from "lucide-react";

type Props = IntegrationHubProps & {
  className?: string;
};

export function IntegrationHubPopover(props: Props) {
  const { className, ...hub } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 size-10 sm:size-9 rounded-xl text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 touch-manipulation",
            className
          )}
          title="Ad accounts"
        >
          <Plus className="size-5 sm:size-[1.125rem]" strokeWidth={2} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[min(calc(100vw-1.5rem),26rem)] max-w-[min(100vw-1.5rem,26rem)] border-zinc-800 bg-zinc-950 p-3.5 text-zinc-100 shadow-xl shadow-black/40"
      >
        <p className="mb-0.5 text-sm font-semibold text-zinc-100">Ad accounts</p>
        <p className="mb-3 text-xs text-zinc-500">Connect Google and Meta, then choose the account context for chat.</p>
        <IntegrationHubContent {...hub} compact />
      </PopoverContent>
    </Popover>
  );
}
