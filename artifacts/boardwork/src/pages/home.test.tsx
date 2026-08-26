import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("carries the remembered appearance into a new blank activity", () => {
    render(<Home />);

    fireEvent.click(screen.getByTestId("button-blank"));

    expect(screen.getByTestId("board-editor-draft")).toHaveTextContent(
      '"presentationTheme":{"kind":"curated","themeId":"paper-v2","accentId":"sage","typographyId":"clear"}',
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
            typographyId: "clear",
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
});