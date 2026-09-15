import { useState, useCallback, useMemo, useRef } from "react";
import { X, Plus, AlertCircle, RotateCw } from "lucide-react";
import {
  useListSavedContexts,
  getListSavedContextsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedContextPicker } from "./saved-context-picker";
import { cn } from "@/lib/utils";

export interface SavedContextControlProps {
  classId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function SavedContextControl({
  classId,
  selectedIds,
  onSelectionChange,
  disabled,
}: SavedContextControlProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // We query the contexts to render the labels for the selected pills.
  const { data, refetch, isError, isFetching } = useListSavedContexts(
    { classId },
    {
      query: {
        queryKey: getListSavedContextsQueryKey({ classId }),
        // If we have selected IDs, we need the data to show their labels.
        // Otherwise, we only strictly need it when the picker opens.
        enabled: selectedIds.length > 0 || pickerOpen,
      },
    }
  );

  const handleOpenPicker = useCallback(() => {
    setPickerOpen(true);
    refetch(); // Fresh refetch on opening
  }, [refetch]);

  const handleRemove = useCallback(
    (idToRemove: string) => {
      onSelectionChange(selectedIds.filter((id) => id !== idToRemove));
    },
    [selectedIds, onSelectionChange]
  );

  // Validate and match selected IDs with the fetched library
  const selectedContexts = useMemo(() => {
    if (!data) {
      if (isError) {
        return selectedIds.map((id) => ({
          id,
          label: "Error loading context",
          isAvailable: false,
          error: "Failed to load context library. Please retry.",
        }));
      }
      // While loading, just render skeletons or fallback to IDs if we must,
      // but usually we can just show empty or a loading state if needed.
      // We will map IDs to a temporary object to avoid layout shifts.
      return selectedIds.map((id) => ({
        id,
        label: "Loading...",
        isAvailable: true,
        error: undefined,
      }));
    }

    return selectedIds.map((id) => {
      const item = data.items.find((i) => i.id === id);
      if (!item) {
        return {
          id,
          label: "Unavailable context",
          isAvailable: false,
          error: "This context was deleted, archived, or moved to another class.",
        };
      }
      return {
        id,
        label: item.label,
        isAvailable: true,
        error: undefined,
      };
    });
  }, [data, selectedIds, isError]);

  return (
    <div className="space-y-3" data-testid="saved-context-control">
      <h2 className="text-sm font-medium">Context <span className="font-normal text-muted-foreground">(optional)</span></h2>
      {selectedContexts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selectedContexts.map((ctx) => (
            <span
              key={ctx.id}
              data-testid={`context-pill-${ctx.id}`}
              className={cn(
                "inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-sm font-medium border max-w-full",
                ctx.isAvailable
                  ? "bg-secondary text-secondary-foreground border-transparent"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {!ctx.isAvailable && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="size-3.5 mr-1 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{ctx.error}</TooltipContent>
                </Tooltip>
              )}
              <span className="truncate max-w-[12rem] min-w-0" dir="auto">
                {ctx.label}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(ctx.id)}
                disabled={disabled}
                className={cn(
                  "ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`Remove ${ctx.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          {(
            <Button
              ref={triggerRef}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={isError && !data ? () => refetch() : handleOpenPicker}
              disabled={disabled || (isError && !data && isFetching)}
              data-testid="button-add-context"
            >
              {isError && !data ? <RotateCw className={cn("mr-1 size-3", isFetching && "animate-spin")} /> : <Plus className="mr-1 size-3" />}
              {isError && !data ? "Retry" : "Add context"}
            </Button>
          )}
        </div>
      )}

      {selectedIds.length === 0 && (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 rounded-full px-3 text-xs", isError && !data && "border-destructive/30 text-destructive hover:bg-destructive/10")}
          onClick={isError && !data ? () => refetch() : handleOpenPicker}
          disabled={disabled || (isError && !data && isFetching)}
          data-testid="button-add-context-empty"
        >
          {isError && !data ? (
            <RotateCw className={cn("mr-1 size-3", isFetching && "animate-spin")} />
          ) : (
            <Plus className="mr-1 size-3" />
          )}
          {isError && !data ? "Retry loading context" : "Add context"}
        </Button>
      )}

      {selectedIds.length > 6 && selectedIds.length < 20 && (
        <p className="text-xs text-muted-foreground" data-testid="context-guidance-message">
          Keep context focused for the best results.
        </p>
      )}
      
      {selectedIds.length >= 20 && (
        <p className="text-xs text-destructive font-medium" data-testid="context-limit-message">
          Maximum of 20 contexts selected. Remove some to add more.
        </p>
      )}

      <SavedContextPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        classId={classId}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        data={data}
        isLoading={!data && pickerOpen}
        isError={isError}
        isFetching={isFetching}
        onRefetch={refetch}
        onCloseFocus={() => triggerRef.current?.focus()}
      />
    </div>
  );
}
