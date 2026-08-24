import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/store/boardwork-context";

interface ChipGroupProps {
  chips: Chip[];
  selectedChipIds: string[];
  onToggleSelection: (id: string) => void;
  onAddChip: (label: string) => void;
  onUpdateChip: (id: string, label: string) => void;
  onDeleteChip: (id: string) => void;
  onClearSelection: () => void;
}

export function ChipGroup({
  chips,
  selectedChipIds,
  onToggleSelection,
  onAddChip,
  onUpdateChip,
  onDeleteChip,
  onClearSelection,
}: ChipGroupProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setNewLabel("");
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddSubmit = () => {
    const trimmed = newLabel.trim();
    if (trimmed) {
      onAddChip(trimmed);
    }
    setNewLabel("");
    setIsAdding(false);
  };

  const [editingChipId, setEditingChipId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChipId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChipId]);

  const handleEditSubmit = () => {
    const trimmed = editLabel.trim();
    if (trimmed && editingChipId) {
      // We need an onUpdateChip prop, wait, we don't have it.
      // Let's add it.
      onUpdateChip(editingChipId, trimmed);
    }
    setEditingChipId(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingChipId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Teaching focus</span>
        {selectedChipIds.length > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Optional reusable skill emphasis for this class. Select one or more to guide today&apos;s board.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          if (editingChipId === chip.id) {
            return (
              <div key={chip.id} className="flex items-center rounded-full border border-primary bg-background px-3 py-1.5">
                <input
                  ref={editInputRef}
                  type="text"
                  dir="auto"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleEditSubmit}
                  className="boardwork-user-content w-24 bg-transparent text-sm font-medium outline-none text-foreground"
                  data-testid={`input-edit-chip-${chip.id}`}
                />
              </div>
            );
          }

          const isSelected = selectedChipIds.includes(chip.id);
          return (
            <div
              key={chip.id}
              className={cn(
                "group relative flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors border cursor-pointer select-none",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              )}
              onClick={() => onToggleSelection(chip.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingChipId(chip.id);
                setEditLabel(chip.label);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleSelection(chip.id);
                }
              }}
              data-testid={`chip-${chip.id}`}
            >
              <span className="boardwork-user-content" dir="auto">{chip.label}</span>
              <button
                type="button"
                className={cn(
                  "ml-1.5 -mr-1 rounded-full p-0.5 opacity-0 focus:opacity-100 group-hover:opacity-100 transition-opacity",
                  isSelected ? "hover:bg-primary-foreground/20" : "hover:bg-muted"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChip(chip.id);
                }}
                aria-label={`Delete ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {isAdding ? (
          <div className="flex items-center rounded-full border border-primary bg-background px-3 py-1.5">
            <input
              ref={inputRef}
              type="text"
              dir="auto"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleAddKeyDown}
              onBlur={handleAddSubmit}
              className="boardwork-user-content w-24 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal"
              placeholder="New chip..."
              data-testid="input-new-chip"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="button-add-chip"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
