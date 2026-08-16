import React, { useRef, useEffect } from "react";
import { ActivityDraft } from "@/store/boardwork-context";
import { Button } from "./ui/button";
import { Plus, X, Monitor, Clock, FileText } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BoardEditorProps {
  draft: ActivityDraft;
  onChange: (updates: Partial<ActivityDraft>) => void;
  onPresent?: () => void;
}

function EditableText({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onChange(e.currentTarget.textContent || "");
  };

  const Component = multiline ? "div" : "span";

  return (
    <Component
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      data-placeholder={placeholder}
      className={cn(
        "outline-none cursor-text transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 hover:bg-muted/40 focus:bg-muted/20 focus:ring-2 focus:ring-primary/20 rounded-md px-1.5 -mx-1.5 py-0.5 -my-0.5",
        className
      )}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
        }
      }}
    />
  );
}

export function BoardEditor({ draft, onChange, onPresent }: BoardEditorProps) {
  const addPrompt = () => {
    if (draft.prompts.length < 3) {
      onChange({ prompts: [...draft.prompts, ""] });
    }
  };

  const updatePrompt = (index: number, val: string) => {
    const newPrompts = [...draft.prompts];
    newPrompts[index] = val;
    onChange({ prompts: newPrompts });
  };

  const removePrompt = (index: number) => {
    const newPrompts = [...draft.prompts];
    newPrompts.splice(index, 1);
    onChange({ prompts: newPrompts });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-xl border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Board Preview
        </div>
        <div className="flex gap-2">
          <Link href="/present" onClick={onPresent} className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-1.5 cursor-pointer" data-testid="button-present">
  <Monitor className="w-4 h-4" />
  Present Screen
</Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <EditableText
                value={draft.eyebrow || ""}
                onChange={(val) => onChange({ eyebrow: val })}
                placeholder="EYEBROW (OPTIONAL)"
                className="text-xs font-bold tracking-widest text-muted-foreground uppercase min-w-[200px] inline-block"
              />
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <EditableText
                  value={String(draft.durationMinutes)}
                  onChange={(val) => {
                    const num = parseInt(val);
                    if (!isNaN(num)) onChange({ durationMinutes: num as 5|7|10 });
                  }}
                  placeholder="7"
                  className="font-medium text-foreground min-w-[1ch] text-center inline-block"
                />
                <span className="font-medium">MIN</span>
              </div>
            </div>

            <EditableText
              value={draft.title}
              onChange={(val) => onChange({ title: val })}
              placeholder="Enter a short title..."
              className="text-3xl md:text-4xl font-bold tracking-tight text-foreground block w-full"
            />
          </div>

          <EditableText
            multiline
            value={draft.task}
            onChange={(val) => onChange({ task: val })}
            placeholder="Describe the main task for students..."
            className="text-lg md:text-xl leading-relaxed text-foreground block w-full"
          />

          {draft.prompts.length > 0 && (
            <ul className="space-y-3 list-none p-0 m-0">
              {draft.prompts.map((prompt, idx) => (
                <li key={idx} className="flex gap-3 group relative text-lg md:text-xl text-foreground">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <EditableText
                    multiline
                    value={prompt}
                    onChange={(val) => updatePrompt(idx, val)}
                    placeholder="Enter prompt..."
                    className="flex-1 leading-relaxed"
                  />
                  <button
                    onClick={() => removePrompt(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-md absolute -left-10 top-1 transition-opacity"
                    title="Remove prompt"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {draft.prompts.length < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addPrompt}
              className="text-muted-foreground hover:text-foreground gap-1.5 -ml-3"
            >
              <Plus className="w-4 h-4" />
              Add Prompt
            </Button>
          )}

          <div className="pt-8 mt-8 border-t">
            <EditableText
              multiline
              value={draft.arrivalInstructions || ""}
              onChange={(val) => onChange({ arrivalInstructions: val })}
              placeholder="Arrival instructions (optional footer)..."
              className="text-muted-foreground text-sm block w-full"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
