import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CurrentInstructionalContext } from "@/store/boardwork-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InstructionalContextPanelProps {
  value: CurrentInstructionalContext;
  onChange: (updates: Partial<CurrentInstructionalContext>) => void;
}

export function InstructionalContextPanel({ value, onChange }: InstructionalContextPanelProps) {
  const [open, setOpen] = useState(false);
  const hasContext = Boolean(
    value.unitOrProject.trim() ||
    value.conceptsTopics.trim() ||
    value.skills.trim() ||
    value.standardsObjectives.trim(),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-y py-1">
      <CollapsibleTrigger
        className="group flex w-full items-center justify-between gap-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        data-testid="button-toggle-instructional-context"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">Class context for generation</span>
          <span className="block text-xs text-muted-foreground">
            {hasContext ? "Saved for this class" : "Reused across this class’s activities"}
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="pb-4 pt-2">
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Boardwork reuses this information across activities for this class. Update it when the unit or emphasis changes.
        </p>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="current-unit-project">Unit or project</Label>
            <Input
              id="current-unit-project"
              value={value.unitOrProject}
              onChange={(event) => onChange({ unitOrProject: event.target.value })}
              placeholder="e.g. Cells and transport"
              data-testid="input-current-unit-project"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-concepts">Concepts or topics</Label>
            <Textarea
              id="current-concepts"
              value={value.conceptsTopics}
              onChange={(event) => onChange({ conceptsTopics: event.target.value })}
              placeholder="e.g. Osmosis, diffusion, concentration"
              className="min-h-16 resize-y"
              data-testid="textarea-current-concepts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-skills">Skills to reinforce</Label>
            <Input
              id="current-skills"
              value={value.skills}
              onChange={(event) => onChange({ skills: event.target.value })}
              placeholder="e.g. Interpreting diagrams, explaining evidence"
              data-testid="input-current-skills"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current-objectives">Objectives currently emphasized</Label>
            <Textarea
              id="current-objectives"
              value={value.standardsObjectives}
              onChange={(event) => onChange({ standardsObjectives: event.target.value })}
              placeholder="Optional short notes—not a standards lookup"
              className="min-h-16 resize-y"
              data-testid="textarea-current-objectives"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}