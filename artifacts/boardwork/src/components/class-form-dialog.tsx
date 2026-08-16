import { ClassProfile, Chip, ActivityDraft } from "@/store/boardwork-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ClassProfile, "id" | "chips">) => void;
  onDelete?: () => void;
  initialData?: ClassProfile | null;
}

export function ClassFormDialog({ open, onOpenChange, onSubmit, onDelete, initialData }: ClassFormDialogProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [courseContext, setCourseContext] = useState("");
  const [currentUnit, setCurrentUnit] = useState("");
  const [arrivalInstructions, setArrivalInstructions] = useState("");
  const [defaultDeviceMode, setDefaultDeviceMode] = useState<"off" | "on">("off");
  const [defaultDuration, setDefaultDuration] = useState<5 | 7 | 10>(7);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setGrade(initialData?.grade || "");
      setSubject(initialData?.subject || "");
      setCourseContext(initialData?.courseContext || "");
      setCurrentUnit(initialData?.currentUnit || "");
      setArrivalInstructions(initialData?.arrivalInstructions || "");
      setDefaultDeviceMode(initialData?.defaultDeviceMode || "off");
      setDefaultDuration(initialData?.defaultDuration || 7);
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      grade,
      subject,
      courseContext,
      currentUnit,
      arrivalInstructions,
      defaultDeviceMode,
      defaultDuration,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Class" : "Create Class"}</DialogTitle>
          <DialogDescription>
            Provide details about your class. Boardwork uses this context to create relevant activities.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name *</Label>
              <Input
                id="className"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 6th Grade Science"
                data-testid="input-class-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade/Age *</Label>
              <Input
                id="grade"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. Grade 6"
                data-testid="input-class-grade"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Life Science"
              data-testid="input-class-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseContext">Course Context</Label>
            <Textarea
              id="courseContext"
              value={courseContext}
              onChange={(e) => setCourseContext(e.target.value)}
              placeholder="e.g. Students are learning core life science practices. Keep reading demands moderate."
              className="resize-none"
              data-testid="textarea-class-context"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label>Default Device Mode</Label>
              <Select value={defaultDeviceMode} onValueChange={(val: "off" | "on") => setDefaultDeviceMode(val)}>
                <SelectTrigger data-testid="select-default-device">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Device Off</SelectItem>
                  <SelectItem value="on">Device On</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Default Duration</Label>
              <Select value={String(defaultDuration)} onValueChange={(val) => setDefaultDuration(Number(val) as 5 | 7 | 10)}>
                <SelectTrigger data-testid="select-default-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Minutes</SelectItem>
                  <SelectItem value="7">7 Minutes</SelectItem>
                  <SelectItem value="10">10 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6 sm:justify-between">
            {initialData && onDelete ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete} data-testid="button-delete-class">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Class
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-class">
                {initialData ? "Save Changes" : "Create Class"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}