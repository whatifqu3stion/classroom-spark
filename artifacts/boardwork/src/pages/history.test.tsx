import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import History from "./history";
import { useBoardwork } from "@/store/boardwork-context";
import type { AppState } from "@workspace/api-client-react";

vi.mock("@/store/boardwork-context", () => ({
  useBoardwork: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@workspace/api-client-react", () => ({
  useClearNonFavoriteActivities: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteActivity: () => ({ isPending: false, mutate: vi.fn() }),
  useDuplicateActivity: () => ({ isPending: false, mutate: vi.fn() }),
  useSetActivityFavorite: () => ({ isPending: false, mutate: vi.fn() }),
  getGetAppStateQueryKey: () => ["app-state"],
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useLocation: () => ["/history", vi.fn()],
}));

const formulaTitle = "Quadratic \\(x^2 + y^2 = r^2\\)";

const appState = {
  activeClassId: "math",
  classes: [{ id: "math", name: "Algebra", color: "#2563eb" }],
  chips: [],
  instructionalContexts: [],
  activities: [
    {
      id: "formula-activity",
      classId: "math",
      title: formulaTitle,
      eyebrow: null,
      task: "Explore a quadratic relationship.",
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
  ],
} as unknown as AppState;

describe("History", () => {
  beforeEach(() => {
    vi.mocked(useBoardwork).mockReturnValue({
      appState,
      isLoading: false,
      activeClassId: "math",
      selectedChipIds: [],
      toggleChipSelection: vi.fn(),
      clearChipSelection: vi.fn(),
    });
  });

  it("renders formula titles in All while keeping action labels readable", () => {
    render(<History />);

    const activity = screen.getByTestId("history-item-formula-activity");
    expect(activity.querySelector(".formula-rendered")).toBeInTheDocument();
    expect(activity).toHaveTextContent("Quadratic x2+y2=r2");
    expect(screen.getByRole("button", { name: `Unfavorite ${formulaTitle}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Actions for ${formulaTitle}` })).toBeInTheDocument();
    expect(screen.getByTestId("history-view-all")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-plain-activity")).toBeInTheDocument();
  });

  it("keeps formula titles rendered when switching to Favorites", () => {
    render(<History />);

    fireEvent.click(screen.getByTestId("history-view-favorites"));

    expect(screen.getByTestId("history-view-favorites")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-formula-activity").querySelector(".formula-rendered")).toBeInTheDocument();
    expect(screen.queryByTestId("history-item-plain-activity")).not.toBeInTheDocument();
  });
});