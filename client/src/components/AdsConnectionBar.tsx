import { IntegrationHubContent } from "@/components/IntegrationHubContent";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Props = {
  workspaceStoreId: number;
  selectedGoogleAdsAccountId: number | null;
  selectedMetaAdsAccountId: number | null;
  onSelectGoogle: (id: number | null) => void;
  onSelectMeta: (id: number | null) => void;
  className?: string;
};

export function AdsConnectionBar({
  workspaceStoreId,
  selectedGoogleAdsAccountId,
  selectedMetaAdsAccountId,
  onSelectGoogle,
  onSelectMeta,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3.5 sm:py-3 text-left text-sm font-medium hover:bg-muted/50 min-h-12 touch-manipulation"
      >
        <span>Google Ads &amp; Meta - connection and account selection</span>
        {expanded ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 py-4 max-h-[min(50vh,420px)] overflow-y-auto">
          <IntegrationHubContent
            workspaceStoreId={workspaceStoreId}
            selectedGoogleAdsAccountId={selectedGoogleAdsAccountId}
            selectedMetaAdsAccountId={selectedMetaAdsAccountId}
            onSelectGoogle={onSelectGoogle}
            onSelectMeta={onSelectMeta}
          />
        </div>
      )}
    </div>
  );
}
