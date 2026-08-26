import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Unit } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface UnitFormValues {
  name: string;
  conceptsTopics: string;
  skills: string;
  standardsObjectives: string;
}

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UnitFormValues) => void;
  onDelete?: () => void;
  initialUnit?: Unit | null;
}

const getValues = (unit?: Unit | null): UnitFormValues => ({
  name: unit?.name ?? "",
  conceptsTopics: unit?.conceptsTopics ?? "",
  skills: unit?.skills ?? "",
  standardsObjectives: unit?.standardsObjectives ?? "",
});

export function UnitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  initialUnit,
}: UnitFormDialogProps) {
  const [values, setValues] = useState<UnitFormValues>(() => getValues(initialUnit));
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(getValues(initialUnit));
      setShowError(false);
    }
  }, [initialUnit, open]);

  const update = (key: keyof UnitFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name") setShowError(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setShowError(true);
      return;
    }
    onSubmit({
      name: values.name.trim(),
      conceptsTopics: values.conceptsTopics.trim(),
      skills: values.skills.trim(),
      standardsObjectives: values.standardsObjectives.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialUnit ? "Edit unit" : "Add a reusable unit"}</DialogTitle>
          <DialogDescription>
            Keep unit details separate from the class so you can reuse them later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="unit-name" className="text-sm font-medium text-foreground">
              Unit name
            </label>
            <Input
              id="unit-name"
              autoFocus
              dir="auto"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Cells and transport"
              data-testid="input-unit-name"
               aria-invalid={showError}
               aria-describedby={showError ? "unit-name-error" : undefined}
            />
            {showError && (
              <p id="unit-name-error" className="text-xs text-destructive" role="alert">
                Enter a unit name.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="unit-concepts" className="text-sm font-medium text-foreground">
              Concepts or topics <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="unit-concepts"
              dir="auto"
              value={values.conceptsTopics}
              onChange={(event) => update("conceptsTopics", event.target.value)}
              placeholder="e.g. Osmosis, diffusion, concentration"
              className="min-h-16 resize-y boardwork-user-content"
              data-testid="textarea-unit-concepts"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="unit-skills" className="text-sm font-medium text-foreground">
              Skills to reinforce <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="unit-skills"
              dir="auto"
              value={values.skills}
              onChange={(event) => update("skills", event.target.value)}
              placeholder="e.g. Interpreting diagrams, explaining evidence"
              className="boardwork-user-content"
              data-testid="input-unit-skills"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="unit-objectives" className="text-sm font-medium text-foreground">
              Objectives currently emphasized <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="unit-objectives"
              dir="auto"
              value={values.standardsObjectives}
              onChange={(event) => update("standardsObjectives", event.target.value)}
              placeholder="Optional short notes—not a standards lookup"
              className="min-h-16 resize-y boardwork-user-content"
              data-testid="textarea-unit-objectives"
            />
          </div>

          <DialogFooter className="pt-1 sm:justify-between">
            {initialUnit && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onDelete}
                data-testid="button-delete-unit"
              >
                <Trash2 className="mr-2 size-4" />
                Remove unit
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-unit">
                {initialUnit ? "Save unit" : "Add unit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}