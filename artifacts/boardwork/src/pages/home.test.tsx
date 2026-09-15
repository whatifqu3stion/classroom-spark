import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./home";
import { useBoardwork } from "@/store/boardwork-context";
import { rememberPresentationTheme } from "@/lib/presentation-theme";
import type { AppState } from "@workspace/api-client-react";
import type { ActivityDraft } from "@/store/boardwork-context";

const mocks = vi.hoisted(() => ({
  setLocation: vi.fn(),
  generateActivity: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  updateClass: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
  activityId: undefined as string | undefined,
}));

vi.mock("@/store/boardwork-context", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/store/boardwork-context")>(),
  useBoardwork: vi.fn(),
}));

vi.mock("wouter", () => ({
  useRoute: () => [!!mocks.activityId, mocks.activityId ? { id: mocks.activityId } : undefined],
  useLocation: () => ["/", mocks.setLocation],
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: mocks.setQueryData,
    invalidateQueries: mocks.invalidateQueries,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/components/layout/shell", () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/board-editor", () => ({
  BoardEditor: ({ draft, onChange, onRetrySave, saveStatus }: { draft: ActivityDraft; onChange: (draft: Partial<ActivityDraft>) => void; onRetrySave?: () => void; saveStatus?: string }) => (
    <>
      <output data-testid="board-editor-draft">{JSON.stringify(draft)}</output>
      <button onClick={() => onChange({ task: "Edited task" })}>Edit test board</button>
      <button onClick={onRetrySave}>Retry test save</button>
      <output data-testid="mock-save-status">{saveStatus}</output>
    </>
  ),
}));

vi.mock("@/components/saved-context/saved-context-control", () => ({
  SavedContextControl: ({
    selectedIds,
    onSelectionChange,
  }: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  }) => (
    <button
      type="button"
      data-testid="mock-context-selection"
      onClick={() => onSelectionChange(selectedIds.length ? [] : ["context-1"])}
    >
      {selectedIds.length ? "Remove saved context" : "Select saved context"}
    </button>
  ),
}));

vi.mock("@/components/class-form-dialog", () => ({
  ClassFormDialog: ({
    open,
    onOpenChange,
    onSubmit,
    initialData,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
      name: string;
      grade: string;
      subject: string;
      defaultDeviceMode: "off" | "on";
      defaultDuration: number;
    }) => void;
    initialData?: {
      name: string;
      grade: string;
      subject: string;
      defaultDuration: number;
    } | null;
  }) =>
    open ? (
      <>
        <button
          type="button"
          data-testid="mock-set-default-device-on"
          onClick={() => {
            onSubmit({
              name: initialData?.name ?? "Science",
              grade: initialData?.grade ?? "5",
              subject: initialData?.subject ?? "Science",
              defaultDeviceMode: "on",
              defaultDuration: initialData?.defaultDuration ?? 5,
            });
            onOpenChange(false);
          }}
        />
        <button
          type="button"
          data-testid="mock-set-default-device-off"
          onClick={() => {
            onSubmit({
              name: initialData?.name ?? "Science",
              grade: initialData?.grade ?? "5",
              subject: initialData?.subject ?? "Science",
              defaultDeviceMode: "off",
              defaultDuration: initialData?.defaultDuration ?? 5,
            });
            onOpenChange(false);
          }}
        />
      </>
    ) : null,
}));

vi.mock("@/components/class-color-dot", () => ({
  ClassColorDot: () => <span />,
}));

vi.mock("@workspace/api-client-react", () => ({
  useCreateClass: () => ({ mutate: vi.fn() }),
  useUpdateClass: () => ({ mutate: mocks.updateClass, mutateAsync: vi.fn() }),
  useDeleteClass: () => ({ mutate: vi.fn() }),
  useSelectClass: () => ({ mutate: vi.fn() }),
  useUpdateInstructionalContext: () => ({ mutate: vi.fn() }),
  useCreateActivity: () => ({ mutateAsync: mocks.createActivity }),
  useGenerateActivity: () => ({ mutateAsync: mocks.generateActivity }),
  useUpdateActivity: () => ({ mutateAsync: mocks.updateActivity }),
  useCreateUnit: () => ({ mutate: vi.fn() }),
  useUpdateUnit: () => ({ mutate: vi.fn() }),
  useDeleteUnit: () => ({ mutate: vi.fn() }),
  getGetAppStateQueryKey: () => ["app-state"],
  getListSavedContextsQueryKey: () => ["saved-context"],
}));

const appState = {
  activeClassId: "class-1",
  classes: [
    {
      id: "class-1",
      name: "Science",
      subject: "Science",
      color: "#2563eb",
      defaultDuration: 10,
      defaultDeviceMode: "off" as const,
      arrivalRoutine: null,
    },
  ],
  chips: [],
  instructionalContexts: [
    {
      classId: "class-1",
      unitOrProject: "",
      conceptsTopics: "",
      skills: "",
      standardsObjectives: "",
    },
  ],
  units: [],
  activities: [],
} as unknown as AppState;

const secondClassState = {
  ...appState,
  activeClassId: "class-2",
  classes: [
    ...appState.classes,
    {
      id: "class-2",
      name: "Math",
      grade: "5",
      subject: "Math",
      color: "#16a34a",
      defaultDuration: 12,
      defaultDeviceMode: "on" as const,
      arrivalRoutine: null,
    },
  ],
} as unknown as AppState;

const initialViewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const creationViewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "narrow", width: 390, height: 844 },
] as const;

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
};

describe("Home presentation defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activityId = undefined;
    localStorage.clear();
    vi.mocked(useBoardwork).mockReturnValue({
      appState,
      isLoading: false,
      activeClassId: "class-1",
      selectedChipIds: [],
      toggleChipSelection: vi.fn(),
      clearChipSelection: vi.fn(),
    });
    rememberPresentationTheme({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
      typographyId: "clear",
    });
  });

  afterEach(() => {
    setViewport(initialViewport.width, initialViewport.height);
  });

  it("carries the remembered appearance into a new blank activity", () => {
    render(<Home />);

    fireEvent.click(screen.getByTestId("button-blank"));

    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(
      '"durationMinutes":5',
    );
    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(
      '"presentationTheme":{"kind":"curated","themeId":"paper-v2","accentId":"sage"}',
    );
  });

  it("carries the remembered appearance into a generated activity request", async () => {
    mocks.generateActivity.mockResolvedValue({
      id: "activity-1",
      classId: "class-1",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 7,
      deviceMode: "off",
    });

    render(<Home />);
    fireEvent.click(screen.getByTestId("button-generate"));

    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({
          presentationTheme: {
            kind: "curated",
            themeId: "paper-v2",
            accentId: "sage",
          },
        }),
      }),
    );
  });

  it("trims multiline mixed context into topic and omits the legacy goal field", async () => {
    mocks.generateActivity.mockResolvedValue({
      id: "activity-context",
      classId: "class-1",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 7,
      deviceMode: "off",
    });

    render(<Home />);
    fireEvent.change(screen.getByTestId("input-topic"), {
      target: {
        value:
          "  Compare the water cycle and carbon cycle.\n\nStandard: explain how matter moves through systems.  ",
      },
    });
    fireEvent.click(screen.getByTestId("button-generate"));

    await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(1));
    expect(mocks.generateActivity.mock.calls[0][0].data).toMatchObject({
      topic:
        "Compare the water cycle and carbon cycle.\n\nStandard: explain how matter moves through systems.",
    });
    expect(mocks.generateActivity.mock.calls[0][0].data).not.toHaveProperty("goal");
  });

  it.each(["", " \n\t  "])(
    "maps blank and whitespace-only context %j to an undefined topic",
    async (value) => {
      mocks.generateActivity.mockResolvedValue({
        id: "activity-empty-context",
        classId: "class-1",
        title: "Generated",
        task: "Practice",
        prompts: [],
        durationMinutes: 7,
        deviceMode: "off",
      });

      render(<Home />);
      fireEvent.change(screen.getByTestId("input-topic"), {
        target: { value },
      });
      fireEvent.click(screen.getByTestId("button-generate"));

      await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(1));
      expect(mocks.generateActivity.mock.calls[0][0].data).toHaveProperty("topic", undefined);
      expect(mocks.generateActivity.mock.calls[0][0].data).not.toHaveProperty("goal");
    },
  );

  it("takes Surprise me directly to Present while keeping Create board in the editor", async () => {
    mocks.generateActivity
      .mockResolvedValueOnce({
        id: "activity-surprise",
        classId: "class-1",
        title: "Surprise",
        task: "Practice",
        prompts: [],
        durationMinutes: 7,
        deviceMode: "off",
      })
      .mockResolvedValueOnce({
        id: "activity-created",
        classId: "class-1",
        title: "Created",
        task: "Practice",
        prompts: [],
        durationMinutes: 7,
        deviceMode: "off",
      });

    render(<Home />);
    fireEvent.change(screen.getByTestId("input-topic"), {
      target: { value: "  Fractions on a number line  " },
    });

    fireEvent.click(screen.getByTestId("button-surprise"));
    await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(1));
    expect(mocks.generateActivity.mock.calls[0][0].data).toMatchObject({
      topic: "Fractions on a number line",
      surprise: true,
    });
    expect(mocks.generateActivity.mock.calls[0][0].data).not.toHaveProperty("goal");
    await waitFor(() =>
      expect(mocks.setLocation).toHaveBeenCalledWith("/present/activity-surprise"),
    );

    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(2));
    expect(mocks.generateActivity.mock.calls[1][0].data).toMatchObject({
      topic: "Fractions on a number line",
      surprise: false,
    });
    expect(mocks.generateActivity.mock.calls[1][0].data).not.toHaveProperty("goal");
    await waitFor(() =>
      expect(mocks.setLocation).toHaveBeenCalledWith("/activity/activity-created"),
    );
  });

  it("keeps the creation workspace in place and offers retry after Surprise me fails", async () => {
    mocks.generateActivity.mockRejectedValueOnce({
      data: { error: "The generator is temporarily unavailable." },
    });
    mocks.generateActivity.mockResolvedValueOnce({
      id: "activity-retried",
      classId: "class-1",
      title: "Retried",
      task: "Practice",
      prompts: [],
      durationMinutes: 7,
      deviceMode: "off",
    });

    render(<Home />);
    fireEvent.change(screen.getByTestId("input-topic"), {
      target: { value: "\n  Photosynthesis and energy transfer\n" },
    });
    fireEvent.click(screen.getByTestId("button-surprise"));

    await waitFor(() => {
      expect(screen.getByTestId("generation-error")).toHaveTextContent(
        "The generator is temporarily unavailable.",
      );
    });
    expect(mocks.setLocation).not.toHaveBeenCalled();
    expect(screen.getByTestId("button-retry-generation")).toBeEnabled();
    expect(mocks.generateActivity.mock.calls[0][0].data).toMatchObject({
      topic: "Photosynthesis and energy transfer",
      surprise: true,
    });
    expect(mocks.generateActivity.mock.calls[0][0].data).not.toHaveProperty("goal");

    fireEvent.click(screen.getByTestId("button-retry-generation"));
    await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(2));
    expect(mocks.generateActivity.mock.calls[1][0].data).toMatchObject({
      topic: "Photosynthesis and energy transfer",
      surprise: true,
    });
    expect(mocks.generateActivity.mock.calls[1][0].data).not.toHaveProperty("goal");
  });

  it("reveals the teacher resource fields with Computer Available and sends them to generation", async () => {
    mocks.generateActivity.mockResolvedValue({
      id: "activity-1",
      classId: "class-1",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 7,
      deviceMode: "on",
    });

    render(<Home />);
    fireEvent.click(screen.getByTestId("segment-computer_available"));

    const resourceUrl = screen.getByTestId("input-resource-url");
    const resourceNote = screen.getByTestId("input-resource-note");
    expect(resourceUrl).toBeVisible();
    expect(resourceNote).toBeVisible();

    fireEvent.change(resourceUrl, {
      target: { value: "https://example.com/article" },
    });
    fireEvent.change(resourceNote, {
      target: { value: "Read the short article." },
    });
    fireEvent.click(screen.getByTestId("button-generate"));

    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deviceMode: "on",
          teacherProvidedUrl: "https://example.com/article",
          teacherProvidedResourceNote: "Read the short article.",
        }),
      }),
    );
  });

  it("resets creation inputs and duration to 5 while using the new class technology default", async () => {
    const firstReturn = {
      appState,
      isLoading: false,
      activeClassId: "class-1",
      selectedChipIds: ["old-chip"],
      toggleChipSelection: vi.fn(),
      clearChipSelection: vi.fn(),
    };
    const secondReturn = {
      ...firstReturn,
      appState: secondClassState,
      activeClassId: "class-2",
      selectedChipIds: [],
    };
    vi.mocked(useBoardwork).mockReturnValue(firstReturn);
    const { rerender } = render(<Home />);

    fireEvent.change(screen.getByTestId("input-topic"), {
      target: { value: "Old class topic" },
    });
    fireEvent.change(screen.getByTestId("input-custom-activity-duration"), {
      target: { value: "19" },
    });

    vi.mocked(useBoardwork).mockReturnValue(secondReturn);
    rerender(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("input-topic")).toHaveValue("");
      expect(screen.getByTestId("segment-5")).toHaveClass("bg-background");
      expect(screen.getByTestId("input-custom-activity-duration")).toHaveValue("");
      expect(screen.getByTestId("segment-computer_available")).toHaveClass(
        "bg-background",
      );
    });

    mocks.generateActivity.mockResolvedValue({
      id: "activity-2",
      classId: "class-2",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 5,
      deviceMode: "on",
      technologyMode: "computer_available",
    });
    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({
          classId: "class-2",
          topic: undefined,
          deviceMode: "on",
          technologyMode: "computer_available",
          durationMinutes: 5,
        }),
      }),
    );
  });

  it("initializes blank activities with the normalized technology default in both directions", () => {
    render(<Home />);
    fireEvent.click(screen.getByTestId("button-blank"));
    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(
      '"deviceMode":"off","technologyMode":"no_computer"',
    );

    vi.mocked(useBoardwork).mockReturnValue({
      appState: {
        ...appState,
        activeClassId: "class-2",
        classes: [
          {
            ...appState.classes[0],
            id: "class-2",
            defaultDeviceMode: "on",
          },
        ],
      } as unknown as AppState,
      isLoading: false,
      activeClassId: "class-2",
      selectedChipIds: [],
      toggleChipSelection: vi.fn(),
      clearChipSelection: vi.fn(),
    });
    // Re-rendering represents the active class changing before starting another blank board.
    render(<Home />);
    fireEvent.click(screen.getAllByTestId("button-blank").at(-1)!);
    expect(screen.getAllByTestId("board-editor-draft").at(-1)).toHaveTextContent(
      '"deviceMode":"on","technologyMode":"computer_available"',
    );
  });

  it("uses the original preset selection for generated boards", async () => {
    mocks.generateActivity.mockResolvedValue({
      id: "activity-duration",
      classId: "class-1",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 5,
      deviceMode: "off",
      technologyMode: "no_computer",
    });

    render(<Home />);
    fireEvent.click(screen.getByTestId("segment-5"));
    fireEvent.click(screen.getByTestId("button-generate"));

    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({ durationMinutes: 5 }),
      }),
    );
  });

  it("keeps the original 357 presets and accepts an unlimited custom duration", () => {
    render(<Home />);
    expect(screen.getByTestId("segment-3")).toBeInTheDocument();
    expect(screen.getByTestId("segment-5")).toBeInTheDocument();
    expect(screen.getByTestId("segment-7")).toBeInTheDocument();
    expect(screen.queryByTestId("segment-10")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("input-custom-activity-duration"), {
      target: { value: "121" },
    });
    fireEvent.click(screen.getByTestId("button-blank"));

    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(
      '"durationMinutes":121',
    );
  });

  it("keeps technology and generation aligned when class defaults change", async () => {
    mocks.generateActivity.mockResolvedValue({
      id: "activity-default",
      classId: "class-1",
      title: "Generated",
      task: "Practice",
      prompts: [],
      durationMinutes: 7,
      deviceMode: "on",
      technologyMode: "computer_available",
    });

    render(<Home />);
    fireEvent.click(screen.getByTestId("button-edit-class"));
    fireEvent.click(screen.getByTestId("mock-set-default-device-on"));
    expect(screen.getByTestId("segment-computer_available")).toHaveClass(
      "bg-background",
    );

    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          deviceMode: "on",
          technologyMode: "computer_available",
        }),
      }),
    );

    fireEvent.click(screen.getByTestId("button-edit-class"));
    fireEvent.click(screen.getByTestId("mock-set-default-device-off"));
    expect(screen.getByTestId("segment-no_computer")).toHaveClass("bg-background");

    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          deviceMode: "off",
          technologyMode: "no_computer",
        }),
      }),
    );
  });

  it("removes the optional details section and all its controls", () => {
    render(<Home />);

    expect(screen.getByText("Board settings")).toBeInTheDocument();
    expect(screen.queryByText("Adjust the setup for this board.")).not.toBeInTheDocument();

    expect(screen.queryByText("Add optional details")).not.toBeInTheDocument();
    for (const testId of [
      "button-toggle-customize", "button-add-chip", "input-student-output",
      "select-work-mode", "input-materials-available", "input-completion-signal",
      "select-activity-style", "activity-style-description",
    ]) {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "About board setup" })).toBeInTheDocument();
  });

  it.each([3, 5, 7, 19])("honors %i minutes for Generate, Surprise me, and Start Blank", async (minutes) => {
    // A leftover selection in the shared store must never become a hidden input.
    vi.mocked(useBoardwork).mockReturnValue({
      appState: {
        ...appState,
        units: [{ id: "unit-1", name: "Living things" }],
        instructionalContexts: [{ ...appState.instructionalContexts[0], unitOrProject: "Living things" }],
      } as unknown as AppState,
      isLoading: false, activeClassId: "class-1",
      toggleChipSelection: vi.fn(), clearChipSelection: vi.fn(),
      selectedChipIds: ["stale-chip"],
    });
    mocks.generateActivity.mockResolvedValue({
      id: "generated", classId: "class-1", task: "Practice",
      prompts: [], durationMinutes: minutes, deviceMode: "off",
    });
    render(<Home />);
    expect(screen.getByTestId("segment-5")).toHaveClass("bg-background");
    if (minutes === 19) {
      fireEvent.change(screen.getByTestId("input-custom-activity-duration"), {
        target: { value: String(minutes) },
      });
    } else if (minutes !== 5) {
      fireEvent.click(screen.getByTestId(`segment-${minutes}`));
    }
    fireEvent.change(screen.getByTestId("input-topic"), { target: { value: "Cells" } });
    for (const action of ["button-generate", "button-surprise"]) {
      fireEvent.click(screen.getByTestId(action));
      await waitFor(() => expect(screen.getByTestId(action)).toBeEnabled());
      const payload = mocks.generateActivity.mock.calls.at(-1)![0].data;
      expect(payload).toMatchObject({
        classId: "class-1", unitId: "unit-1", topic: "Cells",
        durationMinutes: minutes, chipIds: [], activityStyle: null,
        surprise: action === "button-surprise",
      });
      expect(payload).not.toHaveProperty("goal");
      for (const field of ["studentOutput", "workMode", "materialsAvailable", "completionSignal"]) {
        expect(payload).not.toHaveProperty(field);
      }
    }
    fireEvent.click(screen.getByTestId("button-blank"));
    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(`"durationMinutes":${minutes}`);
  });

  it("keeps a custom choice when the class profile is saved or refreshed", async () => {
    const { rerender } = render(<Home />);
    fireEvent.change(screen.getByTestId("input-custom-activity-duration"), {
      target: { value: "21" },
    });
    mocks.activityId = "saved";
    rerender(<Home />);
    expect(JSON.parse(screen.getByTestId("board-editor-draft").textContent!)).toEqual(saved);
    mocks.activityId = undefined;
    rerender(<Home />);
    expect(screen.queryByTestId("board-editor-draft")).not.toBeInTheDocument();
    expect(screen.getByTestId("segment-5")).toHaveClass("bg-background");
    expect(screen.getByTestId("input-custom-activity-duration")).toHaveValue("");
    fireEvent.click(screen.getByTestId("button-blank"));
    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent('"durationMinutes":5');
  });

  it("keeps legacy source context intact when saving an edited older board", async () => {
    const saved = {
      id: "saved", classId: "class-1", title: "Saved", task: "Original task",
      prompts: [], durationMinutes: 5, deviceMode: "off" as const,
      sourceTopic: "Legacy topic", sourceGoal: "Legacy goal",
    };
    vi.mocked(useBoardwork).mockReturnValue({
      appState: { ...appState, activities: [saved] } as unknown as AppState,
      isLoading: false, activeClassId: "class-1", selectedChipIds: ["stale-chip"],
      toggleChipSelection: vi.fn(), clearChipSelection: vi.fn(),
    });
    const { rerender } = render(<Home />);
    fireEvent.change(screen.getByTestId("input-custom-activity-duration"), {
      target: { value: "21" },
    });
    mocks.activityId = "saved";
    rerender(<Home />);
    expect(JSON.parse(screen.getByTestId("board-editor-draft").textContent!)).toEqual(saved);
    mocks.activityId = undefined;
    rerender(<Home />);
    expect(screen.queryByTestId("board-editor-draft")).not.toBeInTheDocument();
    expect(screen.getByTestId("segment-5")).toHaveClass("bg-background");
    expect(screen.getByTestId("input-custom-activity-duration")).toHaveValue("");
    fireEvent.click(screen.getByTestId("button-blank"));
    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent('"durationMinutes":5');
  });

  it("keeps legacy source context intact when saving an edited older board", async () => {
    const saved = {
      id: "saved", classId: "class-1", title: "Saved", task: "Original task",
      prompts: [], durationMinutes: 5, deviceMode: "off" as const,
      sourceTopic: "Legacy topic", sourceGoal: "Legacy goal",
    };
    mocks.activityId = saved.id;
    mocks.updateActivity.mockResolvedValue({ ...saved, task: "Edited task" });
    vi.mocked(useBoardwork).mockReturnValue({
      appState: { ...appState, activities: [saved] } as unknown as AppState,
      isLoading: false, activeClassId: "class-1", selectedChipIds: [],
      toggleChipSelection: vi.fn(), clearChipSelection: vi.fn(),
    });
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Edit test board" }));
    await waitFor(() => expect(mocks.updateActivity).toHaveBeenCalledTimes(1), { timeout: 2000 });
    const patch = mocks.updateActivity.mock.calls[0][0].data;
    expect(patch.task).toBe("Edited task");
    expect(patch).not.toHaveProperty("sourceTopic");
    expect(patch).not.toHaveProperty("sourceGoal");
    expect(JSON.parse(screen.getByTestId("board-editor-draft").textContent!)).toMatchObject({
      sourceTopic: "Legacy topic", sourceGoal: "Legacy goal",
    });
  });

  it("saves the combined context with a newly authored blank board", async () => {
    mocks.createActivity.mockResolvedValue({ id: "new-board", classId: "class-1" });
    render(<Home />);
    fireEvent.change(screen.getByTestId("input-topic"), {
      target: { value: "  Fractions\nExplain equivalent values.  " },
    });
    fireEvent.click(screen.getByTestId("button-blank"));
    fireEvent.click(screen.getByRole("button", { name: "Edit test board" }));
    await waitFor(() => expect(mocks.createActivity).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(mocks.createActivity.mock.calls[0][0].data).toMatchObject({
      sourceTopic: "Fractions\nExplain equivalent values.",
      sourceGoal: undefined,
    });
  });

  it("sends selected context separately and keeps it available after generation failure", async () => {
    mocks.generateActivity.mockRejectedValueOnce({
      data: { error: "Please try again." },
    });
    mocks.generateActivity.mockResolvedValueOnce({
      id: "context-board", classId: "class-1", task: "Sketch first",
      prompts: [], durationMinutes: 5, deviceMode: "off",
    });
    render(<Home />);
    fireEvent.change(screen.getByTestId("input-topic"), { target: { value: "Symmetry" } });
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() => expect(screen.getByTestId("generation-error")).toBeVisible());
    expect(screen.getByTestId("mock-context-selection")).toHaveTextContent("Remove saved context");
    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() => expect(mocks.generateActivity).toHaveBeenCalledTimes(2));
    for (const [request] of mocks.generateActivity.mock.calls) {
      expect(request.data).toMatchObject({ topic: "Symmetry", savedContextIds: ["context-1"] });
      expect(request.data).not.toHaveProperty("savedContextSnapshot");
    }
  });

  it("clears saved context on class switch", () => {
    const { rerender } = render(<Home />);
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    vi.mocked(useBoardwork).mockReturnValue({
      appState: secondClassState, isLoading: false, activeClassId: "class-2",
      selectedChipIds: [], toggleChipSelection: vi.fn(), clearChipSelection: vi.fn(),
    });
    rerender(<Home />);
    expect(screen.getByTestId("mock-context-selection")).toHaveTextContent("Select saved context");
  });

  it("saves authored context IDs and retains the server snapshot without sending it in edits", async () => {
    const snapshot = [{ contextId: "context-1", label: "Sketch first", category: "Routine", details: "Draw before explaining." }];
    mocks.createActivity.mockResolvedValue({
      id: "authored-context", classId: "class-1", savedContextSnapshot: snapshot,
    });
    mocks.updateActivity.mockResolvedValue({});
    render(<Home />);
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    fireEvent.click(screen.getByTestId("button-blank"));
    fireEvent.click(screen.getByText("Edit test board"));
    await waitFor(() => expect(mocks.createActivity).toHaveBeenCalled(), { timeout: 2500 });
    expect(mocks.createActivity.mock.calls[0][0].data).toMatchObject({ savedContextIds: ["context-1"] });
    await waitFor(() => {
      const draft = JSON.parse(screen.getByTestId("board-editor-draft").textContent!);
      expect(draft.savedContextSnapshot).toEqual(snapshot);
      expect(draft.savedContextIds).toBeUndefined();
    });
    expect(mocks.createActivity.mock.calls[0][0].data).not.toHaveProperty("savedContextSnapshot");
  });

  it("lets removing context recover an unsaved blank board before its first save", async () => {
    mocks.createActivity.mockResolvedValue({ id: "without-context", classId: "class-1", savedContextSnapshot: [] });
    render(<Home />);
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    fireEvent.click(screen.getByTestId("button-blank"));
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    fireEvent.click(screen.getByText("Edit test board"));
    await waitFor(() => expect(mocks.createActivity).toHaveBeenCalled(), { timeout: 2500 });
    expect(mocks.createActivity.mock.calls[0][0].data.savedContextIds).toEqual([]);
  });

  it("retries a failed in-flight first save with the latest context selection", async () => {
    let rejectSave!: (reason: unknown) => void;
    mocks.createActivity.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSave = reject; }));
    mocks.createActivity.mockResolvedValueOnce({ id: "retried-blank", classId: "class-1", savedContextSnapshot: [] });
    render(<Home />);
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    fireEvent.click(screen.getByTestId("button-blank"));
    fireEvent.click(screen.getByText("Edit test board"));
    await waitFor(() => expect(mocks.createActivity).toHaveBeenCalledTimes(1), { timeout: 2500 });
    expect(mocks.createActivity.mock.calls[0][0].data.savedContextIds).toEqual(["context-1"]);
    fireEvent.click(screen.getByTestId("mock-context-selection"));
    await act(async () => rejectSave({ data: { error: "Context was archived." } }));
    await waitFor(() => expect(screen.getByTestId("mock-save-status")).toHaveTextContent("error"));
    fireEvent.click(screen.getByText("Retry test save"));
    await waitFor(() => expect(mocks.createActivity).toHaveBeenCalledTimes(2), { timeout: 2500 });
    expect(mocks.createActivity.mock.calls[1][0].data.savedContextIds).toEqual([]);
  });

  it.each(["0", "-1", "1.5", "abc"])("rejects invalid custom minutes %s for all creation actions", (value) => {
    render(<Home />);
    fireEvent.change(screen.getByTestId("input-custom-activity-duration"), { target: { value } });
    expect(screen.getByTestId("custom-duration-error")).toBeVisible();
    for (const action of ["button-generate", "button-surprise", "button-blank"]) {
      fireEvent.click(screen.getByTestId(action));
    }
    expect(mocks.generateActivity).not.toHaveBeenCalled();
    expect(screen.queryByTestId("board-editor-draft")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("segment-7"));
    expect(screen.getByTestId("input-custom-activity-duration")).toHaveValue("");
    expect(screen.getByTestId("button-blank")).toBeEnabled();
  });

  it("shows the concise board creation introduction", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "What are students working on today?",
        level: 1,
      }),
    ).toBeInTheDocument();
    const contextDescription = screen.getByText(
      "Add a topic, learning goal, standard, concept, or anything else that should shape the Boardwork.",
    );
    const contextInput = screen.getByTestId("input-topic");
    expect(contextDescription).toHaveAttribute("id", "boardwork-context-description");
    expect(screen.getByLabelText("What are students working on today?")).toBeInTheDocument();
    expect(contextInput.tagName).toBe("TEXTAREA");
    expect(contextInput).toBe(contextDescription.nextElementSibling);
    expect(contextInput).toHaveAttribute("id", "topic");
    expect(contextInput).toHaveAttribute(
      "aria-describedby",
      "boardwork-context-description",
    );
    expect(contextInput).toHaveAttribute("maxLength", "1000");
    expect(
      contextInput.compareDocumentPosition(screen.getByTestId("select-unit")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByTestId("input-goal")).not.toBeInTheDocument();
    expect(screen.queryByText("Create today's board")).not.toBeInTheDocument();
    expect(
      screen.queryByText("What should students practice today?"),
    ).not.toBeInTheDocument();
  });

  it("keeps the empty editor preview quiet and secondary to setup controls", () => {
    render(<Home />);

    const emptyState = screen.getByTestId("empty-editor-state");
      const editorPanel = within(workspace).getByTestId("editor-workspace-panel");
    expect(emptyState).toHaveClass("min-w-0", "w-full", "flex-1");
    expect(screen.getByTestId("empty-editor-content")).toHaveClass(
      "w-full",
      "max-w-md",
      "items-center",
      "text-center",
    );
    expect(emptyState).toHaveClass("bg-muted/20");
    expect(emptyState).not.toHaveClass("border-dashed", "border-2", "rounded-xl");
    expect(editorPanel).toHaveClass("boardwork-editor-panel", "rounded-xl", "border");
    expect(editorPanel).toHaveClass("shadow-teacher-card");
    expect(screen.getByTestId("creation-controls")).toHaveClass("shadow-teacher-card");
    expect(screen.getByTestId("button-generate")).toHaveClass("shadow-sm");
    expect(screen.getByRole("heading", { name: "No activity created yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add what students are working on in Board Setup, then choose Create board. You can also start blank.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Board preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Your board starts here")).not.toBeInTheDocument();
    expect(screen.queryByText("A clear task for students")).not.toBeInTheDocument();
    expect(emptyState.querySelector(".board-editor-empty-state-card")).toBeNull();
  });

  it("keeps the editor workspace frame stable when a board is created", () => {
    render(<Home />);

      const editorPanel = within(workspace).getByTestId("editor-workspace-panel");
    expect(editorPanel).toHaveClass("boardwork-editor-panel", "rounded-xl", "border");
    expect(screen.getByTestId("empty-editor-state")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-blank"));

    expect(screen.getByTestId("board-editor-draft")).toBeInTheDocument();
    expect(screen.queryByTestId("empty-editor-state")).not.toBeInTheDocument();
    expect(editorPanel).toHaveClass("boardwork-editor-panel", "rounded-xl", "border");
  });

  it.each(creationViewports)(
    "keeps the creation workspace reachable without horizontal overflow at $name width",
    ({ width, height }) => {
      setViewport(width, height);
      render(<Home />);

      const workspace = screen.getByTestId("creation-workspace");
      const controls = within(workspace).getByTestId("creation-controls");
      const actions = within(workspace).getByTestId("creation-actions");
      const editorPanel = within(workspace).getByTestId("editor-workspace-panel");
      const classHeader = within(controls).getByTestId("creation-class-header");
      const classSelect = within(classHeader).getByTestId("select-class");

      expect(window.innerWidth).toBe(width);
      expect(window.innerHeight).toBe(height);
      expect(controls).toHaveClass("boardwork-creation-panel");
      expect(classHeader).toHaveClass("boardwork-class-header", "min-w-0");
      expect(classSelect).toBeVisible();
      expect(classSelect).toHaveClass("min-w-0", "flex-1");
      expect(classSelect).not.toHaveClass("sm:w-[280px]", "sm:flex-none");
      expect(editorPanel).toHaveClass("boardwork-editor-panel");
      expect(
        within(controls).getByRole("heading", {
          name: "What are students working on today?",
          level: 1,
        }),
      ).toBeVisible();
      expect(
        within(controls).getByText(
          "Add a topic, learning goal, standard, concept, or anything else that should shape the Boardwork.",
        ),
      ).toBeVisible();

      expect(within(controls).getByTestId("select-unit")).toBeVisible();
      expect(within(controls).getByTestId("input-topic")).toBeVisible();
      expect(within(controls).getByLabelText("What are students working on today?")).toBeVisible();
      expect(within(controls).queryByTestId("input-goal")).not.toBeInTheDocument();
      expect(within(actions).getByTestId("button-generate")).toBeVisible();
      expect(within(actions).getByTestId("button-surprise")).toBeVisible();
      expect(within(actions).getByTestId("button-blank")).toBeVisible();

      for (const element of [
        document.documentElement,
        workspace,
        controls,
        actions,
      ]) {
        expect(
          element.scrollWidth,
          `${element.dataset.testid ?? element.tagName} should not overflow horizontally`,
        ).toBeLessThanOrEqual(element.clientWidth);
      }
    },
  );

  it("keeps example inputs scoped to the airier creation setup", () => {
    render(<Home />);

    expect(screen.getByTestId("creation-controls")).toHaveClass(
      "lg:w-[420px]",
      "xl:w-[500px]",
    );
    expect(screen.getByTestId("input-topic")).toHaveAttribute("id", "topic");
    expect(screen.getByTestId("input-topic")).toHaveAttribute(
      "placeholder",
      "e.g. osmosis: explain how water moves across a membrane",
    );
    expect(screen.getByTestId("input-topic")).toHaveAttribute("maxLength", "1000");
    expect(screen.getByTestId("input-custom-activity-duration")).toHaveAttribute(
      "placeholder",
      "Custom",
    );
  });
});
