import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { useGetAppState, AppState } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

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
  curriculumFramework?: string | null;
  curriculumDetails?: string | null;
  generalContext?: string | null;
  arrivalRoutine?: string | null;
  defaultDeviceMode: DeviceMode;
  defaultDuration: Duration;
  color?: string | null;
}

export interface CurrentInstructionalContext {
  classId: string;
  unitOrProject: string;
  conceptsTopics: string;
  skills: string;
  standardsObjectives: string;
}

export interface ActivityDraft {
  id?: string;
  classId: string;
  eyebrow?: string | null;
  title: string;
  task: string;
  prompts: string[];
  durationMinutes: Duration;
  deviceMode: DeviceMode;
  arrivalInstructions?: string | null;
  resourceUrl?: string | null;
  resourceNote?: string | null;
  materials?: string[];
  teacherNote?: string | null;
  sourceTopic?: string | null;
  sourceGoal?: string | null;
  sourceChipIds?: string[];
  style?: string | null;
  favorite?: boolean;
}

interface BoardworkContextType {
  appState: AppState | undefined;
  isLoading: boolean;
  activeClassId: string | null;
  selectedChipIds: string[];
  toggleChipSelection: (id: string) => void;
  clearChipSelection: () => void;
}

const BoardworkContext = createContext<BoardworkContextType | undefined>(undefined);

const classNameCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export function BoardworkProvider({ children }: { children: ReactNode }) {
  const { data: appState, isLoading, isError, refetch } = useGetAppState();
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);

  const activeClassId = appState?.activeClassId || null;

  useEffect(() => {
    setSelectedChipIds([]);
  }, [activeClassId]);

  useEffect(() => {
    const validChipIds = new Set(appState?.chips.map((chip) => chip.id) ?? []);
    setSelectedChipIds((current) => current.filter((id) => validChipIds.has(id)));
  }, [appState?.chips]);

  const sortedClasses = useMemo(() => {
    if (!appState?.classes) return [];
    return [...appState.classes].sort((a, b) => classNameCollator.compare(a.name, b.name));
  }, [appState?.classes]);

  const toggleChipSelection = (id: string) => {
    setSelectedChipIds((prev) =>
      prev.includes(id) ? prev.filter((chipId) => chipId !== id) : [...prev, id]
    );
  };

  const clearChipSelection = () => {
    setSelectedChipIds([]);
  };

  const value = useMemo(
    () => ({
      appState: appState ? { ...appState, classes: sortedClasses } : undefined,
      isLoading,
      activeClassId,
      selectedChipIds,
      toggleChipSelection,
      clearChipSelection,
    }),
    [appState, sortedClasses, isLoading, activeClassId, selectedChipIds]
  );

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold text-foreground">Boardwork couldn&apos;t load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check the connection and try again. Your saved work is still in the database.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="button-retry-app-state"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <BoardworkContext.Provider value={value}>{children}</BoardworkContext.Provider>;
}

export function useBoardwork() {
  const context = useContext(BoardworkContext);
  if (context === undefined) {
    throw new Error("useBoardwork must be used within a BoardworkProvider");
  }
  return context;
}
