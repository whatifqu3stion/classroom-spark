import React, { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Shell } from "@/components/layout/shell";
import { useBoardwork, DeviceMode, Duration, ClassProfile, ActivityDraft } from "@/store/boardwork-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BoardEditor } from "@/components/board-editor";
import { getLastUsedPresentationTheme } from "@/lib/presentation-theme";
import { ClassFormDialog } from "@/components/class-form-dialog";
import { ClassColorDot } from "@/components/class-color-dot";
import { Settings, Plus, Play, Shuffle, FilePlus, MonitorOff, MonitorSmartphone, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useSelectClass,
  useUpdateInstructionalContext,
  useCreateChip,
  useUpdateChip,
  useDeleteChip,
  useCreateActivity,
  useGenerateActivity,
  useUpdateActivity,
  getGetAppStateQueryKey,
  ActivityInput,
  GenerateActivityInput,
} from "@workspace/api-client-react";
import {
  activityStyleCatalog,
  type ActivityStyleValue,
} from "@workspace/api-zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const shouldShowSubject = (className: string, subject: string) =>
  !className.toLocaleLowerCase().includes(subject.toLocaleLowerCase());

const activityStyleCategories = Array.from(
  new Set(activityStyleCatalog.map((style) => style.category)),
).map((category) => ({
  value: category,
  label:
    activityStyleCatalog.find((style) => style.category === category)
      ?.categoryLabel ?? category,
}));

const PRESET_DURATIONS = [5, 7, 10] as const;

const getGenerationErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "error" in error.data &&
    typeof error.data.error === "string"
  ) {
    return error.data.error;
  }
  return "Boardwork couldn’t generate an activity. Try again.";
};

const isMeaningful = (
  draft: Partial<ActivityDraft>,
  inheritedArrivalRoutine?: string | null,
) => {
  const arrivalInstructions = draft.arrivalInstructions?.trim();
  const inheritedArrival = inheritedArrivalRoutine?.trim();

  return !!(
    draft.title?.trim() ||
    draft.task?.trim() ||
    draft.eyebrow?.trim() ||
    draft.resourceUrl?.trim() ||
    draft.resourceNote?.trim() ||
    draft.materials?.some((material) => material.trim()) ||
    draft.teacherNote?.trim() ||
    draft.prompts?.some((prompt) => prompt.trim()) ||
    (arrivalInstructions && arrivalInstructions !== inheritedArrival)
  );
};

const activitySavePayload = (draft: ActivityDraft) => ({
  title: draft.title,
  task: draft.task,
  prompts: draft.prompts,
  eyebrow: draft.eyebrow,
  arrivalInstructions: draft.arrivalInstructions,
  durationMinutes: draft.durationMinutes,
  deviceMode: draft.deviceMode,
  resourceUrl: draft.resourceUrl,
  resourceNote: draft.resourceNote,
  visualUrl: draft.visualUrl,
  visualDescription: draft.visualDescription,
  materials: draft.materials,
  teacherNote: draft.teacherNote,
  style: draft.style,
  presentationTheme: draft.presentationTheme,
});

export default function Home() {
  const [, params] = useRoute("/activity/:id");
  const activityId = params?.id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    appState,
    activeClassId,
    selectedChipIds,
    toggleChipSelection,
    clearChipSelection
  } = useBoardwork();

  const classes = appState?.classes || [];
  const chips = appState?.chips || [];
  const instructionalContexts = appState?.instructionalContexts || [];
  const activities = appState?.activities || [];

  // Mutations
  const createClassMut = useCreateClass();
  const updateClassMut = useUpdateClass();
  const deleteClassMut = useDeleteClass();
  const selectClassMut = useSelectClass();

  const updateContextMut = useUpdateInstructionalContext();

  const createChipMut = useCreateChip();
  const updateChipMut = useUpdateChip();
  const deleteChipMut = useDeleteChip();

  const createActivityMut = useCreateActivity();
  const generateActivityMut = useGenerateActivity();
  const updateActivityMut = useUpdateActivity();

  // Local UI State
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("off");
  const [duration, setDuration] = useState<Duration>(7);
  const [customDurationInput, setCustomDurationInput] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceNote, setResourceNote] = useState("");
  const [activityStyle, setActivityStyle] = useState<ActivityStyleValue>("Auto");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastGenerationWasSurprise, setLastGenerationWasSurprise] = useState(false);
  const selectedActivityStyle =
    activityStyleCatalog.find((style) => style.value === activityStyle) ??
    activityStyleCatalog[0];

  const isCustomDuration = !PRESET_DURATIONS.includes(duration as (typeof PRESET_DURATIONS)[number]);
  const customDurationError = isCustomDuration
    ? !/^\d+$/.test(customDurationInput)
      ? "Enter a whole number from 1 to 120 minutes."
      : Number(customDurationInput) < 1 || Number(customDurationInput) > 120
        ? "Enter a whole number from 1 to 120 minutes."
        : null
    : null;

  useEffect(() => {
    setCustomDurationInput(isCustomDuration ? String(duration) : "");
  }, [duration, isCustomDuration]);

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [deleteClassAlertOpen, setDeleteClassAlertOpen] = useState(false);

  // Editor State
  const serverActivity = React.useMemo(() => activities.find(a => a.id === activityId), [activities, activityId]);
  const [localDraft, setLocalDraft] = useState<ActivityDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const initializedForId = useRef<string | null>(null);
  const lastSavedRef = useRef<string>("");
  const isCreatingRef = useRef(false);
  const pendingPresentRef = useRef(false);
  const latestDraftRef = useRef<ActivityDraft | null>(null);
  const createPromiseRef = useRef<Promise<boolean> | null>(null);
  const saveLoopPromiseRef = useRef<Promise<void> | null>(null);

  const activeClass = classes.find((c) => c.id === activeClassId);
  const activeChips = chips.filter((c) => c.classId === activeClassId);
  const activeInstructionalContext = activeClassId
    ? instructionalContexts.find((context) => context.classId === activeClassId) ?? {
        classId: activeClassId,
        unitOrProject: "",
        conceptsTopics: "",
        skills: "",
        standardsObjectives: "",
      }
    : null;

  const [localContext, setLocalContext] = useState(activeInstructionalContext);
  useEffect(() => {
    if (activeInstructionalContext && activeInstructionalContext.classId === activeClassId) {
      setLocalContext(activeInstructionalContext);
    }
  }, [activeInstructionalContext, activeClassId]);

  const debouncedContext = useDebounce(localContext, 600);
  useEffect(() => {
    if (debouncedContext && activeClassId && debouncedContext.classId === activeClassId) {
      const isChanged =
        debouncedContext.unitOrProject !== activeInstructionalContext?.unitOrProject ||
        debouncedContext.conceptsTopics !== activeInstructionalContext?.conceptsTopics ||
        debouncedContext.skills !== activeInstructionalContext?.skills ||
        debouncedContext.standardsObjectives !== activeInstructionalContext?.standardsObjectives;

      if (isChanged) {
        updateContextMut.mutate({ classId: activeClassId, data: debouncedContext }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() })
        });
      }
    }
  }, [debouncedContext, activeClassId]);

  // Init Generator
  useEffect(() => {
    if (activeClass && !activityId && !localDraft) {
      setDeviceMode(activeClass.defaultDeviceMode);
      setDuration(activeClass.defaultDuration);
    }
  }, [activeClassId, activeClass, activityId, localDraft]);

  // Init Editor
  useEffect(() => {
    if (activityId) {
      if (serverActivity && initializedForId.current !== activityId) {
        if (serverActivity.classId !== activeClassId) {
          handleSetActiveClass(serverActivity.classId, false);
        }

        initializedForId.current = activityId;
        latestDraftRef.current = serverActivity;
        setLocalDraft(serverActivity);
        lastSavedRef.current = JSON.stringify(activitySavePayload(serverActivity));
        setSaveStatus("idle");
      }
    } else {
      if (initializedForId.current !== null) {
        initializedForId.current = null;
        latestDraftRef.current = null;
        setLocalDraft(null);
        setSaveStatus("idle");
      }
    }
  }, [activityId, serverActivity]);

  const flushActivityUpdates = (targetActivityId: string): Promise<void> => {
    if (saveLoopPromiseRef.current) {
      return saveLoopPromiseRef.current;
    }

    const savePromise = (async () => {
      try {
        while (latestDraftRef.current) {
          const savePayload = activitySavePayload(latestDraftRef.current);
          const currentString = JSON.stringify(savePayload);
          if (currentString === lastSavedRef.current) break;

          setSaveStatus("saving");
          const updatedActivity = await updateActivityMut.mutateAsync({
            activityId: targetActivityId,
            data: savePayload,
          });
          lastSavedRef.current = currentString;
          queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
            if (!old) return old;
            return {
              ...old,
              activities: old.activities.map((activity: any) =>
                activity.id === updatedActivity.id ? updatedActivity : activity,
              ),
            };
          });
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
        throw new Error("Activity autosave failed");
      } finally {
        saveLoopPromiseRef.current = null;
      }
    })();

    saveLoopPromiseRef.current = savePromise;
    return savePromise;
  };

  const createDraft = (
    draft: ActivityDraft,
    presentAfterSave = false,
  ): Promise<boolean> => {
    if (presentAfterSave) {
      pendingPresentRef.current = true;
    }
    if (createPromiseRef.current) {
      return createPromiseRef.current;
    }

    const createPromise = (async () => {
      const savePayload = activitySavePayload(draft);
      const currentString = JSON.stringify(savePayload);
      const payload: ActivityInput = {
        classId: draft.classId,
        ...savePayload,
        sourceTopic: (draft.sourceTopic ?? topic) || undefined,
        sourceGoal: (draft.sourceGoal ?? goal) || undefined,
        sourceChipIds: draft.sourceChipIds ?? selectedChipIds,
      };

      try {
        isCreatingRef.current = true;
        setSaveStatus("saving");
        const newActivity = await createActivityMut.mutateAsync({ data: payload });
        lastSavedRef.current = currentString;
        queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
          if (!old) return old;
          return { ...old, activities: [newActivity, ...old.activities] };
        });

        const latestDraft = latestDraftRef.current ?? draft;
        const persistedDraft: ActivityDraft = {
          ...latestDraft,
          id: newActivity.id,
          classId: newActivity.classId,
        };
        initializedForId.current = newActivity.id;
        latestDraftRef.current = persistedDraft;
        setLocalDraft(persistedDraft);

        if (!pendingPresentRef.current) {
          setLocation(`/activity/${newActivity.id}`);
        }

        await flushActivityUpdates(newActivity.id);
        if (pendingPresentRef.current) {
          pendingPresentRef.current = false;
          setLocation(`/present/${newActivity.id}`);
        }
        return true;
      } catch {
        setSaveStatus("error");
        pendingPresentRef.current = false;
        return false;
      } finally {
        isCreatingRef.current = false;
        createPromiseRef.current = null;
      }
    })();

    createPromiseRef.current = createPromise;
    return createPromise;
  };

  // Autosave Editor
  const debouncedDraft = useDebounce(localDraft, 800);
  useEffect(() => {
    if (!debouncedDraft || !activeClassId) return;

    const currentString = JSON.stringify(activitySavePayload(debouncedDraft));
    if (currentString === lastSavedRef.current) return;

    const persistedActivityId = activityId ?? debouncedDraft.id;
    if (!persistedActivityId) {
      if (
        isMeaningful(
          debouncedDraft,
          classes.find((classProfile) => classProfile.id === debouncedDraft.classId)
            ?.arrivalRoutine,
        ) &&
        !isCreatingRef.current
      ) {
        void createDraft(debouncedDraft);
      }
    } else {
      if (initializedForId.current !== persistedActivityId) return;
      void flushActivityUpdates(persistedActivityId);
    }
  }, [debouncedDraft]);

  // Handlers
  const handleSetActiveClass = async (
    id: string,
    navigateHome: boolean = true,
  ) => {
    if (navigateHome) {
      const draftAtSwitch = latestDraftRef.current ?? localDraft;
      if (draftAtSwitch) {
        if (draftAtSwitch.id) {
          try {
            await flushActivityUpdates(draftAtSwitch.id);
          } catch {
            return;
          }
        } else {
          const draftClass = classes.find(
            (classProfile) => classProfile.id === draftAtSwitch.classId,
          );
          if (isMeaningful(draftAtSwitch, draftClass?.arrivalRoutine)) {
            const saved = await createDraft(draftAtSwitch);
            if (!saved) return;
          }
        }
      }

      latestDraftRef.current = null;
      initializedForId.current = null;
      lastSavedRef.current = "";
      pendingPresentRef.current = false;
      setLocalDraft(null);
      setSaveStatus("idle");
    }

    // Optimistic update
    queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
      if (!old) return old;
      return { ...old, activeClassId: id };
    });

    selectClassMut.mutate({ classId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        if (navigateHome) {
          setLocation("/");
        }
      },
      onError: () =>
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }),
    });
  };

  const handleClassSubmit = (data: Omit<ClassProfile, "id">) => {
    if (editingClassId) {
      const shouldApplyDefaults = editingClassId === activeClassId && !activityId && !localDraft;
      const previousDeviceMode = activeClass?.defaultDeviceMode ?? deviceMode;
      const previousDuration = activeClass?.defaultDuration ?? duration;

      if (shouldApplyDefaults) {
        setDeviceMode(data.defaultDeviceMode);
        setDuration(data.defaultDuration);
      }

      updateClassMut.mutate({ classId: editingClassId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        },
        onError: () => {
          if (shouldApplyDefaults) {
            setDeviceMode(previousDeviceMode);
            setDuration(previousDuration);
          }
        },
      });
    } else {
      createClassMut.mutate({ data }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() })
      });
    }
  };

  const handleDeleteClass = () => {
    if (editingClassId) {
      setClassDialogOpen(false);
      setDeleteClassAlertOpen(true);
    }
  };

  const confirmDeleteClass = () => {
    if (editingClassId) {
      deleteClassMut.mutate({ classId: editingClassId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
          setDeleteClassAlertOpen(false);
          setLocation("/");
        }
      });
    }
  };

  const handleGenerate = async (surprise: boolean = false) => {
    if (isGenerating || !activeClassId || !activeClass || customDurationError) return;
    setLastGenerationWasSurprise(surprise);
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const payload: GenerateActivityInput = {
        classId: activeClassId,
        topic: topic.trim() || undefined,
        goal: goal.trim() || undefined,
        chipIds: selectedChipIds,
        deviceMode,
        durationMinutes: duration,
        activityStyle:
          !surprise && activityStyle !== "Auto" ? activityStyle : null,
        teacherProvidedUrl:
          deviceMode === "on" ? resourceUrl.trim() || null : null,
        teacherProvidedResourceNote:
          deviceMode === "on" ? resourceNote.trim() || null : null,
        surprise,
        presentationTheme: getLastUsedPresentationTheme(),
      };

      const newActivity = await generateActivityMut.mutateAsync({ data: payload });
      queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          activities: [
            newActivity,
            ...old.activities.filter((activity: any) => activity.id !== newActivity.id),
          ],
        };
      });
      setLocation(`/activity/${newActivity.id}`);
    } catch (error) {
      const message = getGenerationErrorMessage(error);
      setGenerationError(message);
      toast({
        title: "Couldn’t generate activity",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startBlank = () => {
    if (!activeClassId || !activeClass) return;
    const blankDraft: ActivityDraft = {
      classId: activeClassId,
      title: "",
      task: "",
      prompts: [],
      durationMinutes: activeClass.defaultDuration,
      deviceMode: activeClass.defaultDeviceMode,
      arrivalInstructions: activeClass.arrivalRoutine,
      presentationTheme: getLastUsedPresentationTheme(),
    };

    setLocation("/");
    latestDraftRef.current = blankDraft;
    setLocalDraft(blankDraft);
    setSaveStatus("idle");
    isCreatingRef.current = false;
    pendingPresentRef.current = false;
  };

  const handlePresent = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      !localDraft ||
      !isMeaningful(
        localDraft,
        classes.find((classProfile) => classProfile.id === localDraft.classId)
          ?.arrivalRoutine,
      )
    ) {
      return;
    }

    if (localDraft.id) {
      try {
        await flushActivityUpdates(localDraft.id);
        setLocation(`/present/${localDraft.id}`);
      } catch {
        // The editor already exposes the save failure; keep the teacher on it.
      }
      return;
    }

    await createDraft(localDraft, true);
  };

  if (classes.length === 0) {
    return (
      <Shell>
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Create your first class</h1>
            <p className="mx-auto mb-7 max-w-sm text-muted-foreground">
              Add the essentials now. You can add curriculum details, routines, and defaults later.
            </p>
            <Button onClick={() => { setEditingClassId(null); setClassDialogOpen(true); }} size="lg" className="gap-2" data-testid="button-create-first-class">
              <Plus className="w-5 h-5" />
              Create class
            </Button>
          </div>
          <ClassFormDialog
            open={classDialogOpen}
            onOpenChange={setClassDialogOpen}
            onSubmit={handleClassSubmit}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-8 py-6 min-h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-3.5rem)] flex flex-col">

        {/* Top Class Selector */}
        <div className="mb-6 flex flex-shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Select value={activeClassId || ""} onValueChange={handleSetActiveClass}>
              <SelectTrigger className="-ml-2 h-auto min-w-0 flex-1 border-transparent bg-transparent px-2 py-2 text-lg font-semibold transition-colors hover:border-border hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 sm:w-[280px] sm:flex-none" data-testid="select-class">
                {activeClass ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <ClassColorDot color={activeClass.color || undefined} />
                    <span className="truncate boardwork-user-content" dir="auto">{activeClass.name}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select a class" />
                )}
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <ClassColorDot color={c.color || undefined} />
                      <span className="boardwork-user-content" dir="auto">{c.name}</span>
                      {shouldShowSubject(c.name, c.subject) && (
                        <span className="text-muted-foreground font-normal boardwork-user-content" dir="auto">{c.subject}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeClass && (
              <Button variant="ghost" size="icon" onClick={() => { setEditingClassId(activeClassId); setClassDialogOpen(true); }} className="-ml-2 shrink-0 text-muted-foreground hover:text-foreground" title="Edit class settings" aria-label="Edit class settings" data-testid="button-edit-class">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditingClassId(null); setClassDialogOpen(true); }} className="shrink-0 gap-2" title="New class" aria-label="New class" data-testid="button-new-class">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Class</span>
          </Button>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-col lg:flex-1 lg:flex-row gap-6 lg:gap-8 lg:min-h-0">

          {/* Left Column: Generator Controls */}
          <div className="w-full lg:w-[400px] xl:w-[460px] flex flex-col gap-5 lg:overflow-y-auto lg:pl-1 lg:pr-2 pb-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create today&apos;s board</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">What should students practice?</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Add a topic or goal. You can fine-tune the board before presenting it.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic or unit <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input
                  id="topic"
                  dir="auto"
                  className="boardwork-user-content"
                  placeholder="e.g. osmosis and diffusion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  data-testid="input-topic"
                />
              </div>
               <div className="space-y-2">
                 <Label htmlFor="goal">Practice goal <span className="font-normal text-muted-foreground">(optional)</span></Label>
                 <p className="text-xs leading-relaxed text-muted-foreground">
                   The student outcome you want from today&apos;s board.
                 </p>
                <Input
                  id="goal"
                  dir="auto"
                  className="boardwork-user-content"
                  placeholder="e.g. explain the evidence"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  data-testid="input-goal"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-card/50 p-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">How will this board run?</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Starts with your class defaults. Adjust for this board when needed.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device mode</Label>
                  <SegmentedControl<DeviceMode>
                    options={[
                      { label: "Off", value: "off", icon: <MonitorOff className="w-4 h-4" /> },
                      { label: "On", value: "on", icon: <MonitorSmartphone className="w-4 h-4" /> },
                    ]}
                    value={deviceMode}
                    onChange={setDeviceMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                        <div className="flex items-center gap-2">
                          <SegmentedControl<Duration>
                            options={PRESET_DURATIONS.map((value) => ({ label: String(value), value }))}
                            value={duration}
                            onChange={setDuration}
                            className="min-w-0 flex-1"
                          />
                          {isCustomDuration && (
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={3}
                              value={customDurationInput}
                              onChange={(event) => {
                                const value = event.target.value;
                                setCustomDurationInput(value);
                                if (/^\d+$/.test(value)) {
                                  const parsed = Number(value);
                                  if (parsed >= 1 && parsed <= 120) {
                                    setDuration(parsed);
                                  }
                                }
                              }}
                              className="w-20 shrink-0"
                              aria-label="Custom duration in minutes"
                              aria-invalid={Boolean(customDurationError)}
                              data-testid="input-custom-activity-duration"
                            />
                          )}
                        </div>
                        {isCustomDuration && (
                          <p className={`text-xs ${customDurationError ? "text-destructive" : "text-muted-foreground"}`} role={customDurationError ? "alert" : undefined} data-testid={customDurationError ? "custom-duration-error" : undefined}>
                            {customDurationError ?? "Custom class default"}
                          </p>
                        )}
                </div>
              </div>
               {deviceMode === "on" && (
                 <div className="col-span-2 space-y-4 border-t pt-3">
                   <div className="space-y-2">
                     <Label htmlFor="resourceUrl">
                       Student resource URL{" "}
                       <span className="font-normal text-muted-foreground">(optional)</span>
                     </Label>
                     <p className="text-xs leading-relaxed text-muted-foreground">
                       Add the link students should use for this board. Boardwork will not invent or inspect links.
                     </p>
                     <Input
                       id="resourceUrl"
                       type="url"
                       inputMode="url"
                       placeholder="https://..."
                       value={resourceUrl}
                       onChange={(e) => setResourceUrl(e.target.value)}
                       data-testid="input-resource-url"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="resourceNote">
                       Resource description{" "}
                       <span className="font-normal text-muted-foreground">(optional)</span>
                     </Label>
                     <Input
                       id="resourceNote"
                       dir="auto"
                       className="boardwork-user-content"
                       placeholder="e.g. A short article introducing biomimicry"
                       value={resourceNote}
                       onChange={(e) => setResourceNote(e.target.value)}
                       data-testid="input-resource-note"
                     />
                   </div>
                 </div>
               )}
            </div>

            <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen} className="rounded-xl border bg-muted/10">
              <CollapsibleTrigger
                className="group flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                data-testid="button-toggle-customize"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Add optional details</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                      Teaching focus and activity style
                  </span>
                </span>
                <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${customizeOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t px-4 pb-4 pt-4">
                <div className="space-y-6">
                  <ChipGroup
                    chips={activeChips}
                    selectedChipIds={selectedChipIds}
                    onToggleSelection={toggleChipSelection}
                    onAddChip={(label) => createChipMut.mutate({ classId: activeClassId!, data: { label } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
                    onUpdateChip={(id, label) => updateChipMut.mutate({ chipId: id, data: { label } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
                    onDeleteChip={(id) => deleteChipMut.mutate({ chipId: id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
                    onClearSelection={clearChipSelection}
                  />

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label htmlFor="activityStyle">Activity style <span className="font-normal text-muted-foreground">(optional)</span></Label>
                       <p className="text-xs leading-relaxed text-muted-foreground">
                         Choose how students will work. Auto is a good default.
                       </p>
                       <Select value={activityStyle} onValueChange={(value) => setActivityStyle(value as ActivityStyleValue)}>
                         <SelectTrigger id="activityStyle" data-testid="select-activity-style">
                           <SelectValue>{selectedActivityStyle.label}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                           {activityStyleCategories.map((category, index) => (
                             <React.Fragment key={category.value}>
                               {index > 0 && <div className="my-1 h-px bg-muted" role="separator" />}
                               <SelectGroup>
                                 <SelectLabel>{category.label}</SelectLabel>
                                 {activityStyleCatalog
                                   .filter((style) => style.category === category.value)
                                   .map((style) => (
                                     <SelectItem
                                       key={style.value}
                                       value={style.value}
                                       textValue={style.label}
                                       className="items-start py-2"
                                     >
                                       <span className="flex flex-col items-start gap-0.5">
                                         <span>{style.label}</span>
                                         <span className="text-xs font-normal text-muted-foreground">
                                           {style.description}
                                         </span>
                                       </span>
                                     </SelectItem>
                                   ))}
                               </SelectGroup>
                             </React.Fragment>
                           ))}
                        </SelectContent>
                      </Select>
                       <p
                         className="text-xs leading-relaxed text-muted-foreground"
                         data-testid="activity-style-description"
                       >
                         {selectedActivityStyle.description}
                       </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
              <Button
                size="lg"
                className="w-full text-base font-semibold shadow-sm gap-2"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                {isGenerating ? "Creating board..." : "Create board"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  data-testid="button-surprise"
                >
                  <Shuffle className="w-4 h-4" />
                  Surprise me
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted"
                  onClick={startBlank}
                  disabled={isGenerating}
                  data-testid="button-blank"
                >
                  <FilePlus className="w-4 h-4" />
                  Start blank
                </Button>
              </div>
              {generationError && (
                <div
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  role="alert"
                  data-testid="generation-error"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{generationError}</p>
                      <Button
                        type="button"
                        variant="link"
                        className="mt-1 h-auto p-0 text-sm"
                        onClick={() => handleGenerate(lastGenerationWasSurprise)}
                        disabled={isGenerating}
                        data-testid="button-retry-generation"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editor */}
          <div className="flex-1 min-h-[500px] lg:min-h-0 pb-6 lg:pb-0">
            {localDraft ? (
              <BoardEditor
                draft={localDraft}
                onChange={(updates) => {
                  setLocalDraft((previous) => {
                    if (!previous) return null;
                    const nextDraft = { ...previous, ...updates };
                    latestDraftRef.current = nextDraft;
                    return nextDraft;
                  });
                }}
                onPresent={handlePresent}
                saveStatus={saveStatus}
                isMeaningful={isMeaningful(
                  localDraft,
                  classes.find((classProfile) => classProfile.id === localDraft.classId)
                    ?.arrivalRoutine,
                )}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground p-8 text-center">
                <FilePlus className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground mb-2">No activity created yet</h3>
                <p className="max-w-sm mb-6">
                  Add a topic or goal on the left, then choose Create board. You can also start blank from the creation actions.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      <ClassFormDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        onSubmit={handleClassSubmit}
        onDelete={handleDeleteClass}
        initialData={editingClassId ? activeClass : null}
        instructionalContext={editingClassId ? localContext : null}
        onInstructionalContextChange={(updates) => setLocalContext((previous) => previous ? { ...previous, ...updates } : previous)}
      />

      <AlertDialog open={deleteClassAlertOpen} onOpenChange={setDeleteClassAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the class, its instructional context, Focus chips, and all associated activities. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-class">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClass}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-class"
            >
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}