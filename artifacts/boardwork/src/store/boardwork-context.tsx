import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type DeviceMode = "off" | "on";
export type Duration = 5 | 7 | 10;

export interface Chip {
  id: string;
  classId: string;
  label: string;
}

export interface ClassProfile {
  id: string;
  name: string;
  grade: string;
  subject: string;
  courseContext?: string;
  currentUnit?: string;
  arrivalInstructions?: string;
  defaultDeviceMode: DeviceMode;
  defaultDuration: Duration;
}

export interface ActivityDraft {
  id: string;
  classId: string;
  eyebrow?: string;
  title: string;
  task: string;
  prompts: string[];
  durationMinutes: Duration;
  deviceMode: DeviceMode;
  arrivalInstructions?: string;
  resourceUrl?: string;
}

interface BoardworkState {
  classes: ClassProfile[];
  chips: Chip[];
  activeClassId: string | null;
  activeDraft: ActivityDraft | null;
  selectedChipIds: string[];
  
  // Actions
  addClass: (profile: Omit<ClassProfile, "id">) => void;
  updateClass: (id: string, profile: Omit<ClassProfile, "id">) => void;
  deleteClass: (id: string) => void;
  setActiveClass: (id: string | null) => void;
  
  addChip: (classId: string, label: string) => void;
  updateChip: (id: string, label: string) => void;
  deleteChip: (id: string) => void;
  toggleChipSelection: (id: string) => void;
  clearChipSelection: () => void;
  
  generateActivity: (params: {
    topic: string;
    goal: string;
    deviceMode: DeviceMode;
    durationMinutes: Duration;
    resourceUrl?: string;
    surprise?: boolean;
  }) => Promise<void>;
  
  startBlank: () => void;
  updateDraft: (updates: Partial<ActivityDraft>) => void;
  clearDraft: () => void;
}

const defaultSampleClassId = "sample-class-1";
const sampleClass: ClassProfile = {
  id: defaultSampleClassId,
  name: "6th Grade Science",
  grade: "Grade 6",
  subject: "Science",
  courseContext: "Students are learning core life science practices. Keep reading demands moderate.",
  currentUnit: "Cells and transport",
  arrivalInstructions: "Grab your notebook, take your seat, and begin silently.",
  defaultDeviceMode: "off",
  defaultDuration: 7,
};

const sampleChips: Chip[] = [
  { id: "chip-1", classId: defaultSampleClassId, label: "predict" },
  { id: "chip-2", classId: defaultSampleClassId, label: "draw" },
  { id: "chip-3", classId: defaultSampleClassId, label: "explain" },
  { id: "chip-4", classId: defaultSampleClassId, label: "scientific reasoning" },
];

const BoardworkContext = createContext<BoardworkState | undefined>(undefined);

export function BoardworkProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<ClassProfile[]>([sampleClass]);
  const [chips, setChips] = useState<Chip[]>(sampleChips);
  const [activeClassId, setActiveClassId] = useState<string | null>(defaultSampleClassId);
  const [activeDraft, setActiveDraft] = useState<ActivityDraft | null>(null);
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);

  const activeClass = classes.find((c) => c.id === activeClassId) || null;

  const addClass = (profile: Omit<ClassProfile, "id">) => {
    const id = `class-${Date.now()}`;
    setClasses((prev) => [...prev, { ...profile, id }]);
    setActiveClassId(id);
  };

  const updateClass = (id: string, profile: Omit<ClassProfile, "id">) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...profile } : c)));
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setChips((prev) => prev.filter((c) => c.classId !== id));
    if (activeClassId === id) {
      setActiveClassId(null);
      setActiveDraft(null);
    }
  };

  const setActiveClass = (id: string | null) => {
    setActiveClassId(id);
    setSelectedChipIds([]);
    setActiveDraft(null);
  };

  const addChip = (classId: string, label: string) => {
    const id = `chip-${Date.now()}`;
    setChips((prev) => [...prev, { id, classId, label }]);
  };

  const updateChip = (id: string, label: string) => {
    setChips((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  const deleteChip = (id: string) => {
    setChips((prev) => prev.filter((c) => c.id !== id));
    setSelectedChipIds((prev) => prev.filter((chipId) => chipId !== id));
  };

  const toggleChipSelection = (id: string) => {
    setSelectedChipIds((prev) =>
      prev.includes(id) ? prev.filter((chipId) => chipId !== id) : [...prev, id]
    );
  };

  const clearChipSelection = () => {
    setSelectedChipIds([]);
  };

  const startBlank = () => {
    if (!activeClassId || !activeClass) return;
    setActiveDraft({
      id: `draft-${Date.now()}`,
      classId: activeClassId,
      title: "",
      task: "",
      prompts: [],
      durationMinutes: activeClass.defaultDuration,
      deviceMode: activeClass.defaultDeviceMode,
      arrivalInstructions: activeClass.arrivalInstructions,
    });
  };

  const generateActivity = async (params: {
    topic: string;
    goal: string;
    deviceMode: DeviceMode;
    durationMinutes: Duration;
    resourceUrl?: string;
    surprise?: boolean;
  }) => {
    if (!activeClassId || !activeClass) return;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response logic
    let mockDraft: ActivityDraft;

    if (params.surprise) {
      mockDraft = {
        id: `draft-${Date.now()}`,
        classId: activeClassId,
        eyebrow: "SURPRISE ME",
        title: "One sentence, two moods",
        task: "Write one sentence describing an empty hallway. Rewrite the same event so it feels threatening without using the words 'scary', 'afraid', or 'danger'.",
        prompts: [],
        durationMinutes: params.durationMinutes,
        deviceMode: params.deviceMode,
        arrivalInstructions: activeClass.arrivalInstructions,
      };
    } else if (params.deviceMode === "on") {
      mockDraft = {
        id: `draft-${Date.now()}`,
        classId: activeClassId,
        eyebrow: "THINK & WRITE",
        title: "Find the strongest evidence",
        task: "Open the provided article. Read the first three paragraphs and choose one sentence that best supports the author's main claim.",
        prompts: ["Copy or paraphrase the evidence.", "Explain your choice in one sentence."],
        durationMinutes: params.durationMinutes,
        deviceMode: params.deviceMode,
        resourceUrl: params.resourceUrl,
        arrivalInstructions: activeClass.arrivalInstructions,
      };
    } else {
      // Device Off Default Mock
      mockDraft = {
        id: `draft-${Date.now()}`,
        classId: activeClassId,
        eyebrow: "DO NOW",
        title: "Which cell is in trouble?",
        task: "Draw two simple cells: one in very salty water and one in fresh water. Add arrows showing where you think water will move.",
        prompts: ["What changes in each cell?", "Use 'osmosis' in one sentence."],
        durationMinutes: params.durationMinutes,
        deviceMode: params.deviceMode,
        arrivalInstructions: activeClass.arrivalInstructions,
      };
    }

    setActiveDraft(mockDraft);
  };

  const updateDraft = (updates: Partial<ActivityDraft>) => {
    setActiveDraft((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const clearDraft = () => {
    setActiveDraft(null);
  };

  const value = useMemo(
    () => ({
      classes,
      chips,
      activeClassId,
      activeDraft,
      selectedChipIds,
      addClass,
      updateClass,
      deleteClass,
      setActiveClass,
      addChip,
      updateChip,
      deleteChip,
      toggleChipSelection,
      clearChipSelection,
      generateActivity,
      startBlank,
      updateDraft,
      clearDraft,
    }),
    [classes, chips, activeClassId, activeDraft, selectedChipIds]
  );

  return <BoardworkContext.Provider value={value}>{children}</BoardworkContext.Provider>;
}

export function useBoardwork() {
  const context = useContext(BoardworkContext);
  if (context === undefined) {
    throw new Error("useBoardwork must be used within a BoardworkProvider");
  }
  return context;
}
