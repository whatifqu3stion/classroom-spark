import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import History from "./history";
import { useBoardwork } from "@/store/boardwork-context";
import type { AppState } from "@workspace/api-client-react";

const mocks = vi.hoisted(() => ({
  clearMutate: vi.fn(),
  deleteMutate: vi.fn(),
  duplicateMutate: vi.fn(),
  favoriteMutate: vi.fn(),
  invalidateQueries: vi.fn(),
  setLocation: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/store/boardwork-context", () => ({
  useBoardwork: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}));

vi.mock("@workspace/api-client-react", () => ({
  useClearNonFavoriteActivities: () => ({ isPending: false, mutate: mocks.clearMutate }),
  useDeleteActivity: () => ({ isPending: false, mutate: mocks.deleteMutate }),
  useDuplicateActivity: () => ({ isPending: false, mutate: mocks.duplicateMutate }),
  useSetActivityFavorite: () => ({ isPending: false, mutate: mocks.favoriteMutate }),
  getGetAppStateQueryKey: () => ["app-state"],
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useLocation: () => ["/history", mocks.setLocation],
}));

const formulaTask = "Quadratic \\(x^2 + y^2 = r^2\\)";

const appState = {
  activeClassId: "math",
  classes: [
    { id: "math", name: "Algebra", grade: "8", subject: "Mathematics", color: "#2563eb" },
    { id: "science", name: "Biology", grade: "9", subject: "Science", color: "#16a34a" },
  ],
  chips: [],
  instructionalContexts: [],
  activities: [
    {
      id: "formula-activity",
      classId: "math",
       title: "Legacy activity title",
      eyebrow: null,
       task: formulaTask,
      prompts: [],
      durationMinutes: 15,
      deviceMode: "off",
      updatedAt: "2026-08-24T10:00:00.000Z",
      createdAt: "2026-08-24T09:00:00.000Z",
      favorite: true,
      sourceChipIds: [],
      style: "guided",
    },
    {
      id: "plain-activity",
      classId: "math",
      title: "Review lab notes",
      eyebrow: null,
      task: "Review notes.",
      prompts: [],
      durationMinutes: 10,
      deviceMode: "on",
      updatedAt: "2026-08-23T10:00:00.000Z",
      createdAt: "2026-08-23T09:00:00.000Z",
      favorite: false,
      sourceChipIds: [],
      style: null,
    },
    {
      id: "science-activity",
      classId: "science",
      title: "Cell structures",
      eyebrow: null,
      task: "Label the parts of a cell.",
      prompts: [],
      durationMinutes: 10,
      deviceMode: "off",
      updatedAt: "2026-08-22T10:00:00.000Z",
      createdAt: "2026-08-22T09:00:00.000Z",
      favorite: true,
      sourceChipIds: [],
      style: "guided",
    },
  ],
} as unknown as AppState;

describe("History", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBoardwork).mockReturnValue({
      appState,
      isLoading: false,
      activeClassId: "math",
      selectedChipIds: [],
      toggleChipSelection: vi.fn(),
      clearChipSelection: vi.fn(),
    });
  });

  it("uses task-derived labels instead of legacy activity titles", () => {
    render(<History />);

    const activity = screen.getByTestId("history-item-formula-activity");
    expect(activity).toHaveClass("shadow-teacher-card");
    expect(screen.getByTestId("history-view-all")).toHaveClass("shadow-sm");
    expect(activity.querySelector(".formula-rendered")).toBeInTheDocument();
    expect(activity).toHaveTextContent("Quadratic x2+y2=r2");
    expect(screen.getByRole("button", { name: `Unfavorite ${formulaTask}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Actions for ${formulaTask}` })).toBeInTheDocument();
    expect(activity).not.toHaveTextContent("Legacy activity title");
    expect(screen.getByTestId("history-view-all")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-plain-activity")).toBeInTheDocument();
  });

  it("keeps task-derived labels rendered when switching to Favorites", () => {
    render(<History />);

    fireEvent.click(screen.getByTestId("history-view-favorites"));

    expect(screen.getByTestId("history-view-favorites")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-formula-activity")).toHaveClass("shadow-teacher-card");
    expect(screen.getByTestId("history-item-formula-activity").querySelector(".formula-rendered")).toBeInTheDocument();
    expect(screen.queryByTestId("history-item-plain-activity")).not.toBeInTheDocument();
  });

  it("shows class grade and subject context for activities", () => {
    render(<History />);

    expect(screen.getByTestId("history-item-formula-activity")).toHaveTextContent(/Algebra\s*·\s*8\s*·\s*Mathematics/);
    expect(screen.getByTestId("history-item-science-activity")).toHaveTextContent(/Biology\s*·\s*9\s*·\s*Science/);
  });

  it("filters activities by class and subject in either history view", () => {
    render(<History />);

    fireEvent.click(screen.getByTestId("select-history-class"));
    fireEvent.click(screen.getByRole("option", { name: "Biology" }));

    expect(screen.queryByTestId("history-item-formula-activity")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-item-science-activity")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("history-view-favorites"));
    expect(screen.getByTestId("history-item-science-activity")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("select-history-subject"));
    fireEvent.click(screen.getByRole("option", { name: "Mathematics" }));

    expect(screen.getByText("No favorites saved for Biology")).toBeInTheDocument();
    expect(screen.getByText("This class has no saved favorites for Mathematics.")).toBeInTheDocument();
  });

  it("keeps clear history based on all non-favorites, not active filters", () => {
    render(<History />);

    fireEvent.click(screen.getByTestId("select-history-class"));
    fireEvent.click(screen.getByRole("option", { name: "Biology" }));

    expect(screen.getByTestId("button-clear-history")).toBeInTheDocument();
  });

  it("reports a failed favorite and succeeds when the teacher retries", () => {
    mocks.favoriteMutate
      .mockImplementationOnce((_variables, options) => options.onError(new Error("temporary failure")))
      .mockImplementationOnce((_variables, options) => options.onSuccess());
    render(<History />);

    fireEvent.click(screen.getByTestId("button-favorite-plain-activity"));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Couldn’t update favorite",
      variant: "destructive",
    }));

    fireEvent.click(screen.getByTestId("button-favorite-plain-activity"));
    expect(mocks.invalidateQueries).toHaveBeenCalled();
  });
});