import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { SavedContextSnapshot } from "@workspace/api-client-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface SavedContextSnapshotDetailsProps {
  snapshot?: SavedContextSnapshot[] | null;
}

export function SavedContextSnapshotDetails({ snapshot }: SavedContextSnapshotDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!snapshot || snapshot.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2 border rounded-md p-2 bg-muted/20"
      data-testid="saved-context-snapshot-details"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Layers className="size-4" />
          <span>{snapshot.length} Saved context item{snapshot.length !== 1 && "s"} applied</span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" data-testid="button-toggle-snapshot">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="sr-only">Toggle context snapshot</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-2 pt-1 pb-1">
        {snapshot.map((item, i) => (
          <div key={item.contextId || i} className="rounded bg-background p-2 border shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]" dir="auto">{item.label}</span>
                {item.category && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted whitespace-nowrap shrink-0" dir="auto">
                    {item.category}
                  </span>
                )}
              </div>
              {item.details && (
                <p className="text-xs text-muted-foreground leading-snug boardwork-user-content min-w-0" dir="auto">
                  {item.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
