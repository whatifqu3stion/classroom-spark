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
  ClassFormDialog: () => null,
}));

vi.mock("@/components/chip-group", () => ({
  ChipGroup: () => null,
}));

vi.mock("@/components/class-color-dot", () => ({
  ClassColorDot: () => <span />,
}));

vi.mock("@workspace/api-client-react", () => ({
  useCreateClass: () => ({ mutate: vi.fn() }),
  useUpdateClass: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
  useDeleteClass: () => ({ mutate: vi.fn() }),
  useSelectClass: () => ({ mutate: vi.fn() }),
  useUpdateInstructionalContext: () => ({ mutate: vi.fn() }),
  useCreateChip: () => ({ mutate: vi.fn() }),
  useUpdateChip: () => ({ mutate: vi.fn() }),
  useDeleteChip: () => ({ mutate: vi.fn() }),
  useCreateActivity: () => ({ mutateAsync: mocks.createActivity }),
  useGenerateActivity: () => ({ mutateAsync: mocks.generateActivity }),
  useUpdateActivity: () => ({ mutateAsync: vi.fn() }),
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
  activities: [],
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

  it("reveals the teacher resource fields with Device On and sends them to generation", async () => {
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
    fireEvent.click(screen.getByTestId("segment-on"));

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
});