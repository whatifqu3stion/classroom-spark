import React, { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Shell } from "@/components/layout/shell";
import { useBoardwork, DeviceMode, Duration, TechnologyMode, ClassProfile, ActivityDraft } from "@/store/boardwork-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BoardEditor } from "@/components/board-editor";
import { getLastUsedPresentationTheme } from "@/lib/presentation-theme";
import { ClassFormDialog } from "@/components/class-form-dialog";
import { UnitFormDialog, UnitFormValues } from "@/components/unit-form-dialog";
import { ClassColorDot } from "@/components/class-color-dot";
import { HelpTooltip } from "@/components/ui/tooltip";
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
  useCreateChip,
  useUpdateChip,
  useDeleteChip,
  useCreateActivity,
  useGenerateActivity,
  useUpdateActivity,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  getGetAppStateQueryKey,
  ActivityInput,
  GenerateActivityInput,
} from "@workspace/api-client-react";
import {
  ACTIVITY_PAYLOAD_TOO_LARGE_ERROR,
  activityStyleCatalog,
  technologyModeForDeviceMode,
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

const FAST_ACTIVITY_STYLES = [
  "Auto",
  "Retrieval Practice",
  "Observe & Notice",
  "Quick Write",
  "Apply",
] as const;
const PRESET_DURATIONS = [3, 5, 7, 10] as const;
type WorkMode = "quiet" | "think_together" | "discussion" | "teacher_check";

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

const getActivitySaveErrorMessage = (error: unknown, fallback: string) => {
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
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 413
  ) {
    return ACTIVITY_PAYLOAD_TOO_LARGE_ERROR;
  }
  return fallback;
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
  technologyMode: draft.technologyMode,
  resourceUrl: draft.resourceUrl,
  resourceNote: draft.resourceNote,
  visualUrl: draft.visualUrl,
  visualDescription: draft.visualDescription,
  materials: draft.materials,
  teacherNote: draft.teacherNote,
  style: draft.style,
  presentationTheme: draft.presentationTheme,
});

const runMutation = <T,>(mutation: any, variables: any): Promise<T> => {
  if (typeof mutation.mutateAsync === "function") {
    return mutation.mutateAsync(variables);
  }
  return new Promise<T>((resolve, reject) => {
    mutation.mutate(variables, { onSuccess: resolve, onError: reject });
  });
};

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
  const units = appState?.units || [];
  const chips = appState?.chips || [];
  const instructionalContexts = appState?.instructionalContexts || [];
  const activities = appState?.activities || [];

  // Mutations
  const createClassMut = useCreateClass();
  const updateClassMut = useUpdateClass();
  const deleteClassMut = useDeleteClass();
  const selectClassMut = useSelectClass();

  const createChipMut = useCreateChip();
  const updateChipMut = useUpdateChip();
  const deleteChipMut = useDeleteChip();

  const createActivityMut = useCreateActivity();
  const generateActivityMut = useGenerateActivity();
  const updateActivityMut = useUpdateActivity();
  const createUnitMut = useCreateUnit();
  const updateUnitMut = useUpdateUnit();
  const deleteUnitMut = useDeleteUnit();

  // Local UI State
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [studentOutput, setStudentOutput] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [materialsAvailable, setMaterialsAvailable] = useState("");
  const [completionSignal, setCompletionSignal] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("off");
  const [technologyMode, setTechnologyMode] = useState<TechnologyMode>("no_computer");
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
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [deleteUnitAlertOpen, setDeleteUnitAlertOpen] = useState(false);

  // Editor State
  const serverActivity = React.useMemo(() => activities.find(a => a.id === activityId), [activities, activityId]);
  const [localDraft, setLocalDraft] = useState<ActivityDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const initializedForId = useRef<string | null>(null);
  const lastSavedRef = useRef<string>("");
  const isCreatingRef = useRef(false);
  const pendingPresentRef = useRef(false);
  const latestDraftRef = useRef<ActivityDraft | null>(null);
  const createPromiseRef = useRef<Promise<boolean> | null>(null);
  const saveLoopPromiseRef = useRef<Promise<void> | null>(null);

  const activeClass = classes.find((c) => c.id === activeClassId);
  const activeChips = chips.filter((c) => c.classId === activeClassId);
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;
  const generatorClassIdRef = useRef<string | null>(null);

  const resetGeneratorState = (classProfile: ClassProfile | undefined) => {
    setTopic("");
    setGoal("");
    setSelectedUnitId(null);
    setStudentOutput("");
    setWorkMode("");
    setMaterialsAvailable("");
    setCompletionSignal("");
    setResourceUrl("");
    setResourceNote("");
    setActivityStyle("Auto");
    setCustomizeOpen(false);
    setGenerationError(null);

    if (classProfile) {
      setDeviceMode(classProfile.defaultDeviceMode);
      setTechnologyMode(technologyModeForDeviceMode(classProfile.defaultDeviceMode));
      setDuration(classProfile.defaultDuration);
    }
  };

  useEffect(() => {
    if (!activeClassId || generatorClassIdRef.current === activeClassId) return;
    generatorClassIdRef.current = activeClassId;
    resetGeneratorState(activeClass);
  }, [activeClassId, activeClass]);

  const unitClassRef = useRef<string | null>(null);
  useEffect(() => {
    if (unitClassRef.current !== activeClassId) {
      unitClassRef.current = activeClassId;
      const legacyContext = instructionalContexts.find(
        (context) => context.classId === activeClassId,
      );
      const legacyUnitName = legacyContext?.unitOrProject.trim();
      const legacyUnit = legacyUnitName
        ? units.find((unit) => unit.name === legacyUnitName)
        : undefined;
      setSelectedUnitId(legacyUnit?.id ?? null);
      return;
    }
    if (selectedUnitId && !selectedUnit) {
      setSelectedUnitId(null);
    }
  }, [activeClassId, instructionalContexts, selectedUnit, selectedUnitId, units]);

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
        setSaveError(null);
      }
    } else {
      if (initializedForId.current !== null) {
        initializedForId.current = null;
        latestDraftRef.current = null;
        setLocalDraft(null);
        setSaveStatus("idle");
        setSaveError(null);
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
           setSaveError(null);
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
          setSaveError(null);
      } catch (error) {
        setSaveStatus("error");
        setSaveError(
          getActivitySaveErrorMessage(
            error,
            "Your latest changes were not saved. Check your connection and try again.",
          ),
        );
        throw error;
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
        setSaveError(null);
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
      } catch (error) {
        setSaveStatus("error");
        setSaveError(
          getActivitySaveErrorMessage(
            error,
            "Your activity could not be saved. Your edits are still here—try again.",
          ),
        );
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
    if (!debouncedDraft || !activeClassId || debouncedDraft.classId !== activeClassId) return;

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
            toast({
              title: "Couldn’t switch class",
              description: "Your activity could not be saved first. Try again.",
              variant: "destructive",
            });
            return;
          }
        } else {
          const draftClass = classes.find(
            (classProfile) => classProfile.id === draftAtSwitch.classId,
          );
          if (isMeaningful(draftAtSwitch, draftClass?.arrivalRoutine)) {
            const saved = await createDraft(draftAtSwitch);
            if (!saved) {
              toast({
                title: "Couldn’t switch class",
                description: "Your activity could not be saved first. Try again.",
                variant: "destructive",
              });
              return;
            }
          }
        }
      }

      latestDraftRef.current = null;
      initializedForId.current = null;
      lastSavedRef.current = "";
      pendingPresentRef.current = false;
      setLocalDraft(null);
      setSaveStatus("idle");
      setSaveError(null);
      resetGeneratorState(classes.find((classProfile) => classProfile.id === id));
      clearChipSelection();
    }

    const previousActiveClassId = activeClassId;
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
      onError: () => {
        queryClient.setQueryData(getGetAppStateQueryKey(), (old: any) => {
          if (!old) return old;
          return { ...old, activeClassId: previousActiveClassId };
        });
        toast({
          title: "Couldn’t switch class",
          description: "The class was not changed. Try again.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      },
    });
  };

  const handleClassSubmit = async (data: Omit<ClassProfile, "id">) => {
    if (editingClassId) {
      const shouldApplyDefaults = editingClassId === activeClassId && !activityId && !localDraft;
      const previousDeviceMode = activeClass?.defaultDeviceMode ?? deviceMode;
      const previousDuration = activeClass?.defaultDuration ?? duration;

      if (shouldApplyDefaults) {
        setDeviceMode(data.defaultDeviceMode);
        setTechnologyMode(technologyModeForDeviceMode(data.defaultDeviceMode));
        setDuration(data.defaultDuration);
      }

      try {
        await runMutation(updateClassMut, { classId: editingClassId, data });
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      } catch (error) {
        if (shouldApplyDefaults) {
          setDeviceMode(previousDeviceMode);
          setTechnologyMode(technologyModeForDeviceMode(previousDeviceMode));
          setDuration(previousDuration);
        }
        throw error;
      }
    } else {
      await runMutation(createClassMut, { data });
      queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
    }
  };

  const handleDeleteClass = () => {
    if (editingClassId) {
      setClassDialogOpen(false);
      setDeleteClassAlertOpen(true);
    }
  };

  const confirmDeleteClass = (event?: React.MouseEvent) => {
    if (editingClassId) {
      event?.preventDefault();
      deleteClassMut.mutate({ classId: editingClassId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
          setDeleteClassAlertOpen(false);
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Couldn’t delete class",
            description: "The class was not deleted. Try again.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const editingUnit = units.find((unit) => unit.id === editingUnitId) ?? null;
  const openNewUnit = () => {
    setEditingUnitId(null);
    setUnitDialogOpen(true);
  };

  const handleUnitSubmit = async (data: UnitFormValues) => {
    if (editingUnitId) {
      const updatedUnit = await runMutation<any>(updateUnitMut, { unitId: editingUnitId, data });
      setSelectedUnitId(updatedUnit.id);
      queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      return;
    }

    const createdUnit = await runMutation<any>(createUnitMut, { data });
    setSelectedUnitId(createdUnit.id);
    queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
  };

  const handleDeleteUnit = () => {
    setUnitDialogOpen(false);
    setDeleteUnitAlertOpen(true);
  };

  const confirmDeleteUnit = (event?: React.MouseEvent) => {
    if (!editingUnitId) return;
    event?.preventDefault();
    deleteUnitMut.mutate(
      { unitId: editingUnitId },
      {
        onSuccess: () => {
          if (selectedUnitId === editingUnitId) setSelectedUnitId(null);
          setEditingUnitId(null);
          setDeleteUnitAlertOpen(false);
          queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        },
        onError: () => {
          toast({
            title: "Couldn’t remove unit",
            description: "The unit was not removed. Try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleGenerate = async (surprise: boolean = false) => {
    if (isGenerating || !activeClassId || !activeClass || customDurationError) return;
    setLastGenerationWasSurprise(surprise);
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const payload: GenerateActivityInput = {
        classId: activeClassId,
        unitId: selectedUnitId || undefined,
        topic: topic.trim() || undefined,
        goal: goal.trim() || undefined,
        studentOutput: studentOutput.trim() || undefined,
        workMode: workMode || undefined,
        materialsAvailable: materialsAvailable.trim() || undefined,
        completionSignal: completionSignal.trim() || undefined,
        chipIds: selectedChipIds,
        deviceMode,
        technologyMode,
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
      technologyMode: technologyModeForDeviceMode(activeClass.defaultDeviceMode),
      arrivalInstructions: activeClass.arrivalRoutine,
      presentationTheme: getLastUsedPresentationTheme(),
    };

    setLocation("/");
    latestDraftRef.current = blankDraft;
    setLocalDraft(blankDraft);
    setSaveStatus("idle");
    setSaveError(null);
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

  const retryActivitySave = () => {
    const draft = latestDraftRef.current ?? localDraft;
    if (!draft) return;
    if (draft.id) {
      void flushActivityUpdates(draft.id);
    } else if (isMeaningful(
      draft,
      classes.find((classProfile) => classProfile.id === draft.classId)?.arrivalRoutine,
    )) {
      void createDraft(draft);
    }
  };

  if (classes.length === 0) {
    return (
      <Shell>
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Create your first class</h1>
            <p className="mx-auto mb-7 max-w-sm text-muted-foreground">
              Add the essentials now. Add more class context later if you need it.
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
              <Button variant="ghost" size="icon" onClick={() => { setEditingClassId(activeClassId); setClassDialogOpen(true); }} className="-ml-2 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Edit class settings" data-testid="button-edit-class">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditingClassId(null); setClassDialogOpen(true); }} className="shrink-0 gap-2" aria-label="New class" data-testid="button-new-class">
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
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">What should students practice today?</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Start with one clear idea. You can fine-tune the board before presenting it.
                </p>
              </div>
              <div className="space-y-2 rounded-xl border bg-card/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                     <div className="flex items-center gap-1">
                       <Label htmlFor="unit-select">Current unit <span className="font-normal text-muted-foreground">(optional)</span></Label>
                       <HelpTooltip label="About current units">
                         Select a reusable unit to carry its planning context into this board. Units can be used with other classes.
                       </HelpTooltip>
                     </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1" onClick={openNewUnit} data-testid="button-add-unit">
                    <Plus className="size-4" />
                    Add unit
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedUnitId ?? "none"} onValueChange={(value) => setSelectedUnitId(value === "none" ? null : value)}>
                    <SelectTrigger id="unit-select" className="min-w-0 flex-1" data-testid="select-unit">
                      <SelectValue placeholder="No unit selected">
                        {selectedUnit?.name ?? "No unit selected"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No unit selected</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          <span className="boardwork-user-content" dir="auto">{unit.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedUnit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Edit selected unit"
                      onClick={() => { setEditingUnitId(selectedUnit.id); setUnitDialogOpen(true); }}
                      data-testid="button-edit-unit"
                    >
                      <Settings className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Today&apos;s starting point <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input
                  id="topic"
                  dir="auto"
                  className="boardwork-user-content"
                   placeholder="e.g. a diagram of osmosis"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  data-testid="input-topic"
                />
              </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="goal">What should students be able to do? <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <HelpTooltip label="About the student goal">
                      Add one observable outcome to steer this short board. A full lesson plan is not needed.
                    </HelpTooltip>
                  </div>
                <Input
                  id="goal"
                  dir="auto"
                  className="boardwork-user-content"
                   placeholder="e.g. explain the evidence in one sentence"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  data-testid="input-goal"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-card/50 p-4">
               <div>
                 <div className="flex items-center gap-1">
                   <h2 className="text-sm font-semibold text-foreground">How will this board run?</h2>
                   <HelpTooltip label="About board setup">
                     These choices start from the class defaults and apply only to this board.
                   </HelpTooltip>
                 </div>
              </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-2 sm:col-span-2">
                 <Label>Technology</Label>
                   <SegmentedControl<TechnologyMode>
                    options={[
                       { label: "No computer", value: "no_computer", icon: <MonitorOff className="w-4 h-4" /> },
                       { label: "Available", value: "computer_available", icon: <MonitorSmartphone className="w-4 h-4" /> },
                       { label: "Required", value: "computer_required", icon: <MonitorSmartphone className="w-4 h-4" /> },
                    ]}
                     value={technologyMode}
                     onChange={(value) => {
                       setTechnologyMode(value);
                       setDeviceMode(value === "no_computer" ? "off" : "on");
                     }}
                     className="grid-cols-3"
                  />
                </div>
                 <div className="space-y-2 sm:max-w-[360px]">
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
               {technologyMode !== "no_computer" && (
                 <div className="col-span-2 space-y-4 border-t pt-3">
                   <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="resourceUrl">
                        Teacher-provided resource URL{" "}
                       <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <HelpTooltip label="About student resource links">
                          Paste the link students should open. Boardwork saves the link you provide; it does not create or inspect links.
                        </HelpTooltip>
                      </div>
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
                     Add details only when they will shape the board.
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
                    onAddChip={(label) => createChipMut.mutate(
                      { classId: activeClassId!, data: { label } },
                      {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }),
                        onError: () => toast({
                          title: "Couldn’t add focus chip",
                          description: "The new chip was not saved. Try again.",
                          variant: "destructive",
                        }),
                      },
                    )}
                    onUpdateChip={(id, label) => updateChipMut.mutate(
                      { chipId: id, data: { label } },
                      {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }),
                        onError: () => toast({
                          title: "Couldn’t rename focus chip",
                          description: "The chip name was not changed. Try again.",
                          variant: "destructive",
                        }),
                      },
                    )}
                    onDeleteChip={(id) => deleteChipMut.mutate(
                      { chipId: id },
                      {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() }),
                        onError: () => toast({
                          title: "Couldn’t delete focus chip",
                          description: "The chip was not deleted. Try again.",
                          variant: "destructive",
                        }),
                      },
                    )}
                    onClearSelection={clearChipSelection}
                  />

                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="student-output">What will students leave behind?</Label>
                       <Input
                         id="student-output"
                         dir="auto"
                         className="boardwork-user-content"
                         placeholder="e.g. one annotated diagram or a claim with evidence"
                         value={studentOutput}
                         onChange={(event) => setStudentOutput(event.target.value)}
                         data-testid="input-student-output"
                       />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="work-mode">Work mode</Label>
                       <Select value={workMode || "none"} onValueChange={(value) => setWorkMode(value === "none" ? "" : value as WorkMode)}>
                         <SelectTrigger id="work-mode" data-testid="select-work-mode">
                           <SelectValue placeholder="Choose if useful" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">No preference</SelectItem>
                           <SelectItem value="quiet">Quiet start</SelectItem>
                           <SelectItem value="think_together">Think, then compare</SelectItem>
                           <SelectItem value="discussion">Brief discussion</SelectItem>
                           <SelectItem value="teacher_check">Quick teacher check</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="materials-available">Materials already available</Label>
                       <Input
                         id="materials-available"
                         dir="auto"
                         className="boardwork-user-content"
                         placeholder="e.g. notebook, textbook page 42"
                         value={materialsAvailable}
                         onChange={(event) => setMaterialsAvailable(event.target.value)}
                         data-testid="input-materials-available"
                       />
                     </div>
                     <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="completion-signal">How should students signal done or stuck?</Label>
                       <Input
                         id="completion-signal"
                         dir="auto"
                         className="boardwork-user-content"
                         placeholder="e.g. circle the part they are unsure about"
                         value={completionSignal}
                         onChange={(event) => setCompletionSignal(event.target.value)}
                         data-testid="input-completion-signal"
                       />
                     </div>
                     <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="activityStyle">Activity approach</Label>
                          <HelpTooltip label="About activity approaches">
                            Choose a familiar starting move to guide the generated board, or leave Auto to let Boardwork choose.
                          </HelpTooltip>
                        </div>
                       <Select value={activityStyle} onValueChange={(value) => setActivityStyle(value as ActivityStyleValue)}>
                         <SelectTrigger id="activityStyle" data-testid="select-activity-style">
                           <SelectValue>{selectedActivityStyle.label}</SelectValue>
                         </SelectTrigger>
                         <SelectContent>
                           {FAST_ACTIVITY_STYLES.map((styleValue) => {
                             const style = activityStyleCatalog.find((item) => item.value === styleValue);
                             return style ? (
                               <SelectItem key={style.value} value={style.value} textValue={style.label} className="items-start py-2">
                                 <span className="flex flex-col items-start gap-0.5">
                                   <span>{style.label}</span>
                                   <span className="text-xs font-normal text-muted-foreground">{style.description}</span>
                                 </span>
                               </SelectItem>
                             ) : null;
                           })}
                         </SelectContent>
                       </Select>
                       <p className="text-xs leading-relaxed text-muted-foreground" data-testid="activity-style-description">
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
                saveError={saveError}
                onRetrySave={retryActivitySave}
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
      />

      <UnitFormDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        onSubmit={handleUnitSubmit}
        onDelete={editingUnit ? handleDeleteUnit : undefined}
        initialUnit={editingUnit}
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

      <AlertDialog open={deleteUnitAlertOpen} onOpenChange={setDeleteUnitAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this unit?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the reusable unit from your library. Activities already created keep the unit name and source context they used.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-unit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUnit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-unit"
            >
              Remove unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}