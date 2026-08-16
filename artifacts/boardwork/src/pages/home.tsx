import React, { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Shell } from "@/components/layout/shell";
import { useBoardwork, DeviceMode, Duration, ClassProfile, ActivityDraft } from "@/store/boardwork-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BoardEditor } from "@/components/board-editor";
import { ClassFormDialog } from "@/components/class-form-dialog";
import { ClassColorDot } from "@/components/class-color-dot";
import { InstructionalContextPanel } from "@/components/instructional-context-panel";
import { Settings, Plus, Play, Shuffle, FilePlus, MonitorOff, MonitorSmartphone, Loader2 } from "lucide-react";
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
  useUpdateActivity,
  getGetAppStateQueryKey,
  ActivityInput
} from "@workspace/api-client-react";
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
  style: draft.style,
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
  const updateActivityMut = useUpdateActivity();

  // Local UI State
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("off");
  const [duration, setDuration] = useState<Duration>(7);
  const [resourceUrl, setResourceUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
      updateClassMut.mutate({ classId: editingClassId, data }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() })
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
    if (isGenerating || !activeClassId || !activeClass) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1200)); // Mock latency

      let payload: ActivityInput;
      if (surprise) {
        payload = {
          classId: activeClassId,
          eyebrow: "SURPRISE ME",
          title: "One sentence, two moods",
          task: "Write one sentence describing an empty hallway. Rewrite the same event so it feels threatening without using the words 'scary', 'afraid', or 'danger'.",
          prompts: [],
          durationMinutes: duration,
          deviceMode,
          style: "Surprise Me",
          arrivalInstructions: activeClass.arrivalRoutine,
          sourceTopic: topic || undefined,
          sourceGoal: goal || undefined,
          sourceChipIds: selectedChipIds
        };
      } else if (deviceMode === "on") {
        payload = {
          classId: activeClassId,
          eyebrow: "THINK & WRITE",
          title: "Find the strongest evidence",
          task: "Open the provided article. Read the first three paragraphs and choose one sentence that best supports the author's main claim.",
          prompts: ["Copy or paraphrase the evidence.", "Explain your choice in one sentence."],
          durationMinutes: duration,
          deviceMode,
          resourceUrl,
          style: "Evaluate / Critique",
          arrivalInstructions: activeClass.arrivalRoutine,
          sourceTopic: topic || undefined,
          sourceGoal: goal || undefined,
          sourceChipIds: selectedChipIds
        };
      } else {
        payload = {
          classId: activeClassId,
          eyebrow: "DO NOW",
          title: "Which cell is in trouble?",
          task: "Draw two simple cells: one in very salty water and one in fresh water. Add arrows showing where you think water will move.",
          prompts: ["What changes in each cell?", "Use 'osmosis' in one sentence."],
          durationMinutes: duration,
          deviceMode,
          style: "Observe & Notice",
          arrivalInstructions: activeClass.arrivalRoutine,
          sourceTopic: topic || undefined,
          sourceGoal: goal || undefined,
          sourceChipIds: selectedChipIds
        };
      }

      await createActivityMut.mutateAsync({ data: payload }, {
        onSuccess: (newActivity) => {
          queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
          setLocation(`/activity/${newActivity.id}`);
        }
      });
    } catch (e) {
      toast({ title: "Failed to generate activity", variant: "destructive" });
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
                    <span className="truncate">{activeClass.name}</span>
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
                      <span>{c.name}</span>
                      {shouldShowSubject(c.name, c.subject) && (
                        <span className="text-muted-foreground font-normal">{c.subject}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeClass && (
              <Button variant="ghost" size="icon" onClick={() => { setEditingClassId(activeClassId); setClassDialogOpen(true); }} className="-ml-2 shrink-0 text-muted-foreground hover:text-foreground" title="Edit Class Settings" data-testid="button-edit-class">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditingClassId(null); setClassDialogOpen(true); }} className="shrink-0 gap-2" data-testid="button-new-class">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Class</span>
          </Button>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-col lg:flex-1 lg:flex-row gap-6 lg:gap-8 lg:min-h-0">

          {/* Left Column: Generator Controls */}
          <div className="w-full lg:w-[400px] xl:w-[460px] flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 pb-8">
            {activeClassId && localContext && (
              <InstructionalContextPanel
                value={localContext}
                onChange={(updates) => setLocalContext(prev => prev ? { ...prev, ...updates } : prev)}
              />
            )}

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Today&apos;s boardwork</h2>
                <p className="text-xs text-muted-foreground">Optional context for this activity only</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">What are students working on?</Label>
                <Input
                  id="topic"
                  placeholder="e.g. osmosis and diffusion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  data-testid="input-topic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">What should this practice?</Label>
                <Input
                  id="goal"
                  placeholder="e.g. scientific reasoning"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  data-testid="input-goal"
                />
              </div>
            </div>

            <ChipGroup
              chips={activeChips}
              selectedChipIds={selectedChipIds}
              onToggleSelection={toggleChipSelection}
              onAddChip={(label) => createChipMut.mutate({ classId: activeClassId!, data: { label } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
              onUpdateChip={(id, label) => updateChipMut.mutate({ chipId: id, data: { label } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
              onDeleteChip={(id) => deleteChipMut.mutate({ chipId: id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }) })}
              onClearSelection={clearChipSelection}
            />

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Mode</Label>
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
                  <SegmentedControl<Duration>
                    options={[
                      { label: "5", value: 5 },
                      { label: "7", value: 7 },
                      { label: "10", value: 10 },
                    ]}
                    value={duration}
                    onChange={setDuration}
                  />
                </div>
              </div>

              {deviceMode === "on" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="resourceUrl">Resource URL (Required for Device On)</Label>
                  <Input
                    id="resourceUrl"
                    placeholder="https://..."
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    data-testid="input-resource-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boardwork will not invent URLs. Provide the exact link students need.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 mt-auto">
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
                {isGenerating ? "Creating board..." : "Generate"}
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
                  Surprise Me
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted"
                  onClick={startBlank}
                  disabled={isGenerating}
                  data-testid="button-blank"
                >
                  <FilePlus className="w-4 h-4" />
                  Start Blank
                </Button>
              </div>
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
                  Set your topic and preferences on the left, then click Generate to create a new board.
                </p>
                <Button variant="outline" onClick={startBlank} className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  Start from a blank board
                </Button>
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