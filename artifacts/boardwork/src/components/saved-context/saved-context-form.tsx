import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowLeft, Archive, Trash2, Plus } from "lucide-react";
import type { SavedContext, ContextCategory, SavedContextInputScope } from "@workspace/api-client-react";
import {
  useCreateSavedContext,
  useUpdateSavedContext,
  useArchiveSavedContext,
  useCreateContextCategory,
  getListSavedContextsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface SavedContextFormProps {
  classId: string;
  initialData: SavedContext | null;
  categories: ContextCategory[];
  onClose: () => void;
  onSaved: (id: string) => void;
  onArchived: (id: string) => void;
  onScopeChange: (id: string, newScope: string, classId?: string | null) => void;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    (error as any).data &&
    typeof (error as any).data === "object" &&
    "error" in (error as any).data &&
    typeof (error as any).data.error === "string"
  ) {
    return (error as any).data.error;
  }
  return fallback;
};

export function SavedContextForm({
  classId,
  initialData,
  categories,
  onClose,
  onSaved,
  onArchived,
  onScopeChange,
}: SavedContextFormProps) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(initialData?.label || "");
  const [details, setDetails] = useState(initialData?.details || "");
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId || null);
  const [scope, setScope] = useState<"class" | "global">(initialData?.scope || "class");

  const [error, setError] = useState<string | null>(null);
  
  // Category combobox state
  const [catOpen, setCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");

  const createMut = useCreateSavedContext();
  const updateMut = useUpdateSavedContext();
  const archiveMut = useArchiveSavedContext();
  const createCatMut = useCreateContextCategory();

  const isSaving = createMut.isPending || updateMut.isPending || createCatMut.isPending;
  const isArchiving = archiveMut.isPending;

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    if (label.length > 50) {
      setError("Label must be 50 characters or less.");
      return;
    }
    if (details && details.length > 300) {
      setError("Details must be 300 characters or less.");
      return;
    }
    setError(null);

    try {
      const payload = {
        label: label.trim(),
        details: details.trim() || null,
        categoryId,
        scope: scope as SavedContextInputScope,
        classId: scope === "class" ? classId : null,
      };

      let resultId = "";
      let scopeChanged = false;
      if (initialData) {
        await updateMut.mutateAsync({
          contextId: initialData.id,
          data: payload,
        });
        resultId = initialData.id;
        
        // Check if scope changed so picker can handle deselection
        if (initialData.scope !== scope || (scope === "class" && initialData.classId !== classId)) {
          scopeChanged = true;
        }
      } else {
        const res = await createMut.mutateAsync({ data: payload });
        resultId = res.id;
      }
      
      // Invalidate to refresh the library
      queryClient.invalidateQueries({ queryKey: getListSavedContextsQueryKey({ classId }) });
      
      if (mountedRef.current) {
        if (scopeChanged && initialData) {
          onScopeChange(initialData.id, scope, payload.classId);
        }
        onSaved(resultId);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getApiErrorMessage(err, "Could not save context. Try again."));
      }
    }
  };

  const handleArchive = async () => {
    if (!initialData) return;
    setError(null);
    try {
      await archiveMut.mutateAsync({ contextId: initialData.id });
      queryClient.invalidateQueries({ queryKey: getListSavedContextsQueryKey({ classId }) });
      if (mountedRef.current) {
        onArchived(initialData.id);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getApiErrorMessage(err, "Could not archive context. Try again."));
      }
    }
  };

  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    if (name.length > 40) {
      setError("Category name must be 40 characters or less.");
      return;
    }
    setError(null);
    try {
      const res = await createCatMut.mutateAsync({ data: { name: name.trim() } });
      queryClient.invalidateQueries({ queryKey: getListSavedContextsQueryKey({ classId }) });
      if (mountedRef.current) {
        setCategoryId(res.id);
        setCatOpen(false);
        setCatSearch("");
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(getApiErrorMessage(err, "Could not create category."));
      }
    }
  };

  // Find selected category name
  const selectedCat = categories.find((c) => c.id === categoryId);

  return (
    <>
      <DialogHeader className="p-4 pb-2 flex flex-row items-center gap-2 border-b">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} disabled={isSaving || isArchiving} data-testid="button-back-picker" aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <DialogTitle className="text-base">{initialData ? "Edit context" : "Create context"}</DialogTitle>
          <DialogDescription className="sr-only">Form to create or edit a saved context snippet.</DialogDescription>
        </div>
      </DialogHeader>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-5">
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md" data-testid="context-form-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="context-label">Label</Label>
          <Input
            id="context-label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Include specific examples"
            maxLength={50}
            data-testid="input-context-label"
            autoFocus
          />
          <div className="text-[10px] text-muted-foreground text-right">{label.length}/50</div>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Category (optional)</Label>
          <Popover open={catOpen} onOpenChange={setCatOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={catOpen}
                className="justify-between font-normal"
                data-testid="combobox-context-category"
              >
                {selectedCat ? selectedCat.name : "Select a category..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search or create category..."
                  value={catSearch}
                  onValueChange={setCatSearch}
                  data-testid="input-category-search"
                />
                <CommandList>
                  <CommandEmpty className="p-2 text-sm text-center">
                    {catSearch.trim() ? (
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="w-full text-xs h-8"
                        onClick={() => handleCreateCategory(catSearch)}
                        disabled={createCatMut.isPending}
                        data-testid="button-create-category-inline"
                      >
                        {createCatMut.isPending ? "Creating..." : `Create "${catSearch}"`}
                      </Button>
                    ) : (
                      "No categories found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {categoryId && (
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setCategoryId(null);
                          setCatOpen(false);
                        }}
                        className="text-muted-foreground italic"
                      >
                        Clear selection
                      </CommandItem>
                    )}
                    {categories
                      .filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                      .map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.id}
                          onSelect={(currentValue) => {
                            setCategoryId(currentValue);
                            setCatOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              categoryId === category.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    {catSearch.trim() && !categories.some(c => c.name.toLowerCase() === catSearch.toLowerCase()) && (
                      <CommandItem
                        value={catSearch}
                        onSelect={(currentValue) => handleCreateCategory(currentValue)}
                        className="text-primary font-medium"
                        data-testid="command-create-category"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create "{catSearch}"
                      </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="context-details">Details (optional)</Label>
          <Textarea
            id="context-details"
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add specific instructions that will shape the activity..."
            className="min-h-[80px] resize-none"
            maxLength={300}
            data-testid="textarea-context-details"
          />
          <div className="text-[10px] text-muted-foreground text-right">{details.length}/300</div>
        </div>

        <div className="space-y-3">
          <Label>Availability</Label>
          <RadioGroup value={scope} onValueChange={(val) => setScope(val as "class" | "global")} className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="class" id="scope-class" data-testid="radio-scope-class" />
              <Label htmlFor="scope-class" className="font-normal cursor-pointer">This class only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="global" id="scope-global" data-testid="radio-scope-global" />
              <Label htmlFor="scope-global" className="font-normal cursor-pointer">All classes</Label>
            </div>
          </RadioGroup>
        </div>
      </form>

      <div className="p-4 border-t bg-background flex items-center justify-between gap-2">
        {initialData ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleArchive}
            disabled={isSaving || isArchiving}
            data-testid="button-archive-context"
          >
            <Archive className="mr-2 size-4" />
            Archive
          </Button>
        ) : (
          <div /> // Spacer
        )}
        <Button onClick={handleSave} disabled={isSaving || isArchiving} data-testid="button-save-context">
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData ? "Save changes" : "Create"}
        </Button>
      </div>
    </>
  );
}
