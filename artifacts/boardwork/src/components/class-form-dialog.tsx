import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClassProfile } from "@/store/boardwork-context";
import {
  CLASS_COLOR_OPTIONS,
  CURRICULUM_OPTIONS,
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
} from "@/lib/class-options";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PRESET_DURATIONS = [5, 7, 10] as const;
const CUSTOM_DURATION_DEFAULT = 15;

const classProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter a class name."),
  grade: z.string().trim().min(1, "Enter a grade or age level."),
  subject: z.string().trim().min(1, "Enter a subject."),
  curriculumFramework: z.string(),
  curriculumDetails: z.string(),
  generalContext: z.string(),
  defaultDeviceMode: z.enum(["off", "on"]),
  defaultDuration: z.number().int().min(1, "Enter at least 1 minute.").max(120, "Enter 120 minutes or less."),
  color: z.string(),
});

type ClassProfileFormValues = z.infer<typeof classProfileSchema>;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ClassProfile, "id">) => void | Promise<void>;
  onDelete?: () => void;
  initialData?: ClassProfile | null;
}

const getDefaultValues = (initialData?: ClassProfile | null): ClassProfileFormValues => ({
  name: initialData?.name ?? "",
  grade: initialData?.grade ?? "",
  subject: initialData?.subject ?? "",
  curriculumFramework: initialData?.curriculumFramework ?? "",
  curriculumDetails: initialData?.curriculumDetails ?? "",
  generalContext: initialData?.generalContext ?? "",
  defaultDeviceMode: initialData?.defaultDeviceMode ?? "off",
  defaultDuration: initialData?.defaultDuration ?? 7,
  color: initialData?.color ?? "",
});

const optionalValue = (value: string) => value.trim() || undefined;

export function ClassFormDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  initialData,
}: ClassFormDialogProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<ClassProfileFormValues>({
    resolver: zodResolver(classProfileSchema),
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(initialData));
      setMoreOpen(false);
      setSaveError(null);
      setIsSaving(false);
    }
  }, [form, initialData, open]);

  const handleSubmit = async (values: ClassProfileFormValues) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        grade: values.grade.trim(),
        subject: values.subject.trim(),
        curriculumFramework: optionalValue(values.curriculumFramework),
        curriculumDetails: optionalValue(values.curriculumDetails),
        generalContext: optionalValue(values.generalContext),
        defaultDeviceMode: values.defaultDeviceMode,
        defaultDuration: values.defaultDuration,
        color: optionalValue(values.color),
      });
      onOpenChange(false);
    } catch {
      setSaveError(`Couldn't save this class. Your changes are still here. Try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && isSaving) return;
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit class profile" : "Create class"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update what Boardwork remembers for this class."
              : "Add the essentials now; add more context later if needed."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {saveError && (
              <p className="text-sm text-destructive" role="alert" data-testid="class-save-error">
                {saveError}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Class name</FormLabel>
                    <FormControl>
                        <Input
                        {...field}
                          dir="auto"
                          className="boardwork-user-content"
                        autoFocus
                        placeholder="e.g. Period 2 Science"
                        data-testid="input-class-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade / age level</FormLabel>
                    <FormControl>
                        <Input
                        {...field}
                          dir="auto"
                          className="boardwork-user-content"
                        list="boardwork-grade-options"
                        placeholder="Choose or type your own"
                        data-testid="input-class-grade"
                      />
                    </FormControl>
                    <datalist id="boardwork-grade-options">
                      {GRADE_OPTIONS.map((option) => <option key={option} value={option} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                        <Input
                        {...field}
                          dir="auto"
                          className="boardwork-user-content"
                        list="boardwork-subject-options"
                        placeholder="Choose or type your own"
                        data-testid="input-class-subject"
                      />
                    </FormControl>
                    <datalist id="boardwork-subject-options">
                      {SUBJECT_OPTIONS.map((option) => <option key={option} value={option} />)}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class color</FormLabel>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Class color">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!field.value}
                      onClick={() => field.onChange("")}
                      className={`flex size-9 items-center justify-center rounded-full border text-[10px] text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!field.value ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
                       aria-label="No class color"
                      data-testid="button-class-color-none"
                    >
                      —
                    </button>
                    {CLASS_COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === option.value}
                        onClick={() => field.onChange(option.value)}
                        className={`flex size-9 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${field.value === option.value ? "border-foreground ring-1 ring-foreground" : "border-transparent"}`}
                         aria-label={`Use ${option.label} class color`}
                        data-testid={`button-class-color-${option.label.toLowerCase()}`}
                      >
                        <span
                          className="size-5 rounded-full"
                          style={{ backgroundColor: option.value }}
                          aria-hidden="true"
                        />
                        <span className="sr-only">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <Collapsible open={moreOpen} onOpenChange={setMoreOpen} className="rounded-lg border">
              <CollapsibleTrigger
                className="flex w-full items-center justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                data-testid="button-toggle-more-class-details"
              >
                <span>
                  <span className="block text-sm font-medium">More about this class</span>
                   <span className="block text-xs text-muted-foreground">
                      Curriculum, context, and defaults
                  </span>
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="border-t px-4 pb-5 pt-4">
                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="curriculumFramework"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curriculum / Framework</FormLabel>
                          <FormControl>
                              <Input
                              {...field}
                                dir="auto"
                                className="boardwork-user-content"
                              list="boardwork-curriculum-options"
                              placeholder="Choose or type your own"
                              data-testid="input-class-curriculum"
                            />
                          </FormControl>
                          <datalist id="boardwork-curriculum-options">
                            {CURRICULUM_OPTIONS.map((option) => <option key={option} value={option} />)}
                          </datalist>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="curriculumDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Curriculum details</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              dir="auto"
                              className="boardwork-user-content"
                              placeholder="e.g. IB MYP Design, Year 2"
                              data-testid="input-class-curriculum-details"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="generalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General class context</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            dir="auto"
                            placeholder="Persistent information about the course, learners, or class—not the current unit."
                            className="boardwork-user-content min-h-20 resize-y"
                            data-testid="textarea-class-context"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="defaultDeviceMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default device mode</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-default-device">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="off">Device Off</SelectItem>
                              <SelectItem value="on">Device On</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default duration</FormLabel>
                          <Select
                             value={PRESET_DURATIONS.includes(field.value as (typeof PRESET_DURATIONS)[number]) ? String(field.value) : "custom"}
                             onValueChange={(value) => {
                               if (value === "custom") {
                                 if (PRESET_DURATIONS.includes(field.value as (typeof PRESET_DURATIONS)[number])) {
                                   field.onChange(CUSTOM_DURATION_DEFAULT);
                                 }
                                 return;
                               }
                               field.onChange(Number(value));
                             }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-default-duration">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="7">7 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                               <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                           {!PRESET_DURATIONS.includes(field.value as (typeof PRESET_DURATIONS)[number]) && (
                             <div className="space-y-2">
                               <FormLabel htmlFor="custom-default-duration">Custom minutes</FormLabel>
                               <FormControl>
                                 <Input
                                   id="custom-default-duration"
                                   type="number"
                                   min={1}
                                   max={120}
                                   step={1}
                                   value={field.value ?? ""}
                                   onChange={(event) => {
                                     const value = event.target.value;
                                     field.onChange(value === "" ? undefined : Number(value));
                                   }}
                                   onBlur={field.onBlur}
                                   name={field.name}
                                   ref={field.ref}
                                   data-testid="input-custom-default-duration"
                                 />
                               </FormControl>
                               <p className="text-xs text-muted-foreground">Enter a whole number from 1 to 120 minutes.</p>
                               <FormMessage />
                             </div>
                           )}
                        </FormItem>
                      )}
                    />
                  </div>

                </div>
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter className="pt-1 sm:justify-between">
              {initialData && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onDelete}
                  data-testid="button-delete-class"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete class
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  data-testid="button-cancel-class"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} data-testid="button-save-class">
                  {isSaving ? "Saving…" : initialData ? "Save changes" : "Create class"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}