import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./home";
import { useBoardwork } from "@/store/boardwork-context";
import { rememberPresentationTheme } from "@/lib/presentation-theme";
import type { AppState } from "@workspace/api-client-react";

const mocks = vi.hoisted(() => ({
  setLocation: vi.fn(),
  generateActivity: vi.fn(),
  createActivity: vi.fn(),
  updateClass: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/store/boardwork-context", () => ({
  useBoardwork: vi.fn(),
}));

vi.mock("wouter", () => ({
  useRoute: () => [false, undefined],
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
  BoardEditor: ({ draft }: { draft: unknown }) => (
    <output data-testid="board-editor-draft">{JSON.stringify(draft)}</output>
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
              defaultDuration: initialData?.defaultDuration ?? 7,
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
              defaultDuration: initialData?.defaultDuration ?? 7,
            });
            onOpenChange(false);
          }}
        />
      </>
    ) : null,
}));

vi.mock("@/components/chip-group", () => ({
  ChipGroup: () => null,
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
  useCreateChip: () => ({ mutate: vi.fn() }),
  useUpdateChip: () => ({ mutate: vi.fn() }),
  useDeleteChip: () => ({ mutate: vi.fn() }),
  useCreateActivity: () => ({ mutateAsync: mocks.createActivity }),
  useGenerateActivity: () => ({ mutateAsync: mocks.generateActivity }),
  useUpdateActivity: () => ({ mutateAsync: vi.fn() }),
  useCreateUnit: () => ({ mutate: vi.fn() }),
  useUpdateUnit: () => ({ mutate: vi.fn() }),
  useDeleteUnit: () => ({ mutate: vi.fn() }),
  getGetAppStateQueryKey: () => ["app-state"],
}));

const appState = {
  activeClassId: "class-1",
  classes: [
    {
      id: "class-1",
      name: "Science",
      subject: "Science",
      color: "#2563eb",
      defaultDuration: 7,
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

  it("resets creation inputs and uses the new class defaults after a class switch", async () => {
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
    fireEvent.change(screen.getByTestId("input-goal"), {
      target: { value: "Old class goal" },
    });

    vi.mocked(useBoardwork).mockReturnValue(secondReturn);
    rerender(<Home />);
    await waitFor(() => {
      expect(screen.getByTestId("input-topic")).toHaveValue("");
      expect(screen.getByTestId("input-goal")).toHaveValue("");
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
      durationMinutes: 12,
      deviceMode: "on",
      technologyMode: "computer_available",
    });
    fireEvent.click(screen.getByTestId("button-generate"));
    await waitFor(() =>
      expect(mocks.generateActivity).toHaveBeenCalledWith({
        data: expect.objectContaining({
          classId: "class-2",
          topic: undefined,
          goal: undefined,
          deviceMode: "on",
          technologyMode: "computer_available",
          durationMinutes: 12,
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

  it("does not repeat optional markers inside the collapsed details section", () => {
    render(<Home />);

    expect(screen.getByText("Board settings")).toBeInTheDocument();
    expect(screen.queryByText("Adjust the setup for this board.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-toggle-customize"));

    expect(screen.getByText("What will students leave behind?")).toBeInTheDocument();
    expect(screen.getByText("Work mode")).toBeInTheDocument();
    expect(screen.getByText("Materials already available")).toBeInTheDocument();
    expect(screen.getByText("How should students signal done or stuck?")).toBeInTheDocument();
    expect(screen.getByText("Activity approach")).toBeInTheDocument();
    expect(screen.queryByText("What will students leave behind? (optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Work mode (optional)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About board setup" })).toBeInTheDocument();
  });

  it("shows the concise board creation introduction", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "What are students working on today?",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add a topic or goal. You can refine the board before presenting.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Topic or starting point (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Learning goal (optional)")).toBeInTheDocument();
    expect(screen.queryByText("Create today's board")).not.toBeInTheDocument();
    expect(
      screen.queryByText("What should students practice today?"),
    ).not.toBeInTheDocument();
  });

  it("keeps the empty editor preview quiet and secondary to setup controls", () => {
    render(<Home />);

    const emptyState = screen.getByTestId("empty-editor-state");
    expect(emptyState).toHaveClass("border-dashed", "bg-muted/20");
    expect(screen.getByRole("heading", { name: "No activity created yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add a topic or goal on the left, then choose Create board. You can also start blank from the creation actions.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Board preview")).not.toBeInTheDocument();
    expect(screen.queryByText("Your board starts here")).not.toBeInTheDocument();
    expect(screen.queryByText("A clear task for students")).not.toBeInTheDocument();
    expect(emptyState.querySelector(".board-editor-empty-state-card")).toBeNull();
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
          "Add a topic or goal. You can refine the board before presenting.",
        ),
      ).toBeVisible();

      expect(within(controls).getByTestId("select-unit")).toBeVisible();
      expect(within(controls).getByTestId("input-topic")).toBeVisible();
      expect(within(controls).getByTestId("input-goal")).toBeVisible();
      expect(within(controls).getByLabelText("Topic or starting point (optional)")).toBeVisible();
      expect(within(controls).getByLabelText("Learning goal (optional)")).toBeVisible();
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
    expect(screen.getByTestId("input-topic")).toHaveAttribute("aria-label", "Topic or starting point (optional)");
    expect(screen.getByTestId("input-topic")).toHaveAttribute("placeholder", "e.g. a diagram of osmosis");
    expect(screen.getByTestId("input-goal")).toHaveAttribute(
      "placeholder",
      "e.g. explain the evidence in one sentence",
    );
    expect(screen.getByTestId("input-custom-activity-duration")).toHaveAttribute(
      "placeholder",
      "Custom",
    );
  });
});
