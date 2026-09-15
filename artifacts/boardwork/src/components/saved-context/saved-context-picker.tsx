import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, Plus, Pencil, Check, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import type { SavedContext, SavedContextLibrary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SavedContextForm } from "./saved-context-form";

interface SavedContextPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  data?: SavedContextLibrary;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRefetch: () => void;
  onCloseFocus?: () => void;
}

export function SavedContextPicker({
  open,
  onOpenChange,
  classId,
  selectedIds,
  onSelectionChange,
  data,
  isLoading,
  isError,
  isFetching,
  onRefetch,
  onCloseFocus,
}: SavedContextPickerProps) {
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<SavedContext | "new" | null>(null);
  const previousEditId = useRef<string | null>(null);

  // Close form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEditingItem(null);
      setSearch("");
      previousEditId.current = null;
    }
    onOpenChange(newOpen);
  };

  const handleEditClick = (item: SavedContext | "new") => {
    if (typeof item !== "string") {
      previousEditId.current = item.id;
    } else {
      previousEditId.current = "new";
    }
    setEditingItem(item);
  };

  useEffect(() => {
    if (editingItem === null && previousEditId.current) {
      const id = previousEditId.current;
      setTimeout(() => {
        if (id === "new") {
          const btn = document.querySelector(`[data-testid="button-create-context-picker"]`) as HTMLElement;
          btn?.focus();
        } else {
          const btn = document.querySelector(`[data-testid="context-row-${id}"]`) as HTMLElement;
          btn?.focus();
        }
        previousEditId.current = null;
      }, 0);
    }
  }, [editingItem]);

  const toggleSelection = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((sel) => sel !== id));
      } else {
        if (selectedIds.length >= 20) return; // Hard cap check
        onSelectionChange([...selectedIds, id]);
      }
    },
    [selectedIds, onSelectionChange]
  );

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    
    // Filter out archived items from the main list unless they are currently selected.
    let items = data.items.filter((item) => !item.archived);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q) ||
          item.details?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [data, search]);

  const groupedItems = useMemo(() => {
    const selected: SavedContext[] = [];
    const recent: SavedContext[] = [];
    const classGroups: Record<string, SavedContext[]> = {};
    const globalGroups: Record<string, SavedContext[]> = {};

    // Sort by label for deterministic order within groups
    const sorted = [...filteredItems].sort((a, b) => a.label.localeCompare(b.label));

    // Sort for recent
    const recentSorted = [...sorted]
      .filter((i) => i.lastUsedAt && !selectedIds.includes(i.id))
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime());
    
    const recentIds = new Set(recentSorted.slice(0, 5).map((i) => i.id));

    sorted.forEach((item) => {
      if (selectedIds.includes(item.id)) {
        selected.push(item);
      } else if (recentIds.has(item.id)) {
        recent.push(item);
      } else {
        const cat = item.categoryName || "Uncategorized";
        if (item.scope === "class") {
          if (!classGroups[cat]) classGroups[cat] = [];
          classGroups[cat].push(item);
        } else {
          if (!globalGroups[cat]) globalGroups[cat] = [];
          globalGroups[cat].push(item);
        }
      }
    });

    const groups: { label: string; items: SavedContext[] }[] = [];

    if (selected.length > 0) groups.push({ label: "Selected", items: selected });
    if (recent.length > 0) groups.push({ label: "Recent", items: recent });

    Object.keys(classGroups).sort().forEach((cat) => {
      groups.push({ label: cat === "Uncategorized" ? "This class" : `This class — ${cat}`, items: classGroups[cat] });
    });

    Object.keys(globalGroups).sort().forEach((cat) => {
      groups.push({ label: cat === "Uncategorized" ? "All classes" : `All classes — ${cat}`, items: globalGroups[cat] });
    });

    return groups;
  }, [filteredItems, selectedIds]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[92dvh] max-w-md overflow-hidden flex flex-col p-0 gap-0"
        onCloseAutoFocus={(event) => {
          if (onCloseFocus) {
            event.preventDefault();
            onCloseFocus();
          }
        }}
      >
        {editingItem ? (
          <SavedContextForm
            classId={classId}
            initialData={editingItem === "new" ? null : editingItem}
            categories={data?.categories || []}
            onClose={() => setEditingItem(null)}
            onSaved={(newId) => {
              if (editingItem === "new") {
                if (selectedIds.length < 20) {
                  onSelectionChange([...selectedIds, newId]);
                }
              }
              setEditingItem(null);
            }}
            onArchived={(id) => {
              if (selectedIds.includes(id)) {
                onSelectionChange(selectedIds.filter((sel) => sel !== id));
              }
              setEditingItem(null);
            }}
            onScopeChange={(id, newScope, newClassId) => {
              // If scope changes such that it's no longer valid for this class
              if (newScope === "class" && newClassId !== classId) {
                if (selectedIds.includes(id)) {
                  onSelectionChange(selectedIds.filter((sel) => sel !== id));
                }
              }
            }}
          />
        ) : (
          <>
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Saved context</DialogTitle>
              <DialogDescription className="sr-only">
                Select predefined contexts to shape the generated activity.
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search label, category, or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-context-search"
                />
              </div>
            </div>

            {isFetching && data && (
              <div className="bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground flex items-center justify-center gap-2 border-b">
                <Loader2 className="size-3 animate-spin" />
                Refreshing library...
              </div>
            )}

            <ScrollArea className="flex-1 min-h-[50vh]">
              {isLoading && !isError ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
              ) : isError && !data ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <div className="text-sm text-destructive font-medium">Failed to load saved contexts.</div>
                  <Button variant="outline" size="sm" onClick={() => onRefetch()} disabled={isFetching} data-testid="button-picker-retry">
                    {isFetching && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Retry
                  </Button>
                </div>
              ) : groupedItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {search ? "No matches found." : "No saved context yet."}
                </div>
              ) : (
                <div className="p-2 pb-4 space-y-4">
                  {groupedItems.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <h4 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </h4>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isSelected = selectedIds.includes(item.id);
                          const isDisabled = (!isSelected && selectedIds.length >= 20) || isFetching;

                          return (
                            <div
                              key={item.id}
                              className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                            >
                              <button
                                type="button"
                                disabled={isDisabled}
                                aria-pressed={isSelected}
                                onClick={() => toggleSelection(item.id)}
                                className="flex-1 flex items-start text-left gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid={`context-row-${item.id}`}
                              >
                                <div className={cn("mt-0.5 flex-shrink-0 flex items-center justify-center size-4 border rounded-sm", isSelected ? "border-primary text-primary" : "border-primary/30 text-transparent")}>
                                  {isSelected && <Check className="size-3" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium leading-tight text-foreground boardwork-user-content" dir="auto">
                                    {item.label}
                                  </div>
                                  {item.details && (
                                    <div className="text-xs text-muted-foreground mt-1 boardwork-user-content" dir="auto">
                                      {item.details}
                                    </div>
                                  )}
                                </div>
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 ml-2"
                                onClick={() => handleEditClick(item)}
                                disabled={isFetching}
                                data-testid={`button-edit-context-${item.id}`}
                                aria-label={`Edit ${item.label}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t bg-background">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleEditClick("new")}
                disabled={selectedIds.length >= 20 || isFetching || (isError && !data)}
                title={selectedIds.length >= 20 ? "Remove a selected item before creating and selecting another context." : undefined}
                data-testid="button-create-context-picker"
              >
                <Plus className="mr-2 size-4" />
                Create context
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
