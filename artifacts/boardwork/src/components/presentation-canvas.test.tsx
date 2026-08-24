import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActivityDraft } from "@/store/boardwork-context";
import { PresentationCanvas } from "./presentation-canvas";

const activity: ActivityDraft = {
  classId: "class-1",
  title: "Independent practice",
  task: "Work quietly.",
  prompts: ["Explain your thinking."],
  durationMinutes: 5,
  deviceMode: "off",
};

const timer = {
  visible: true,
  mode: "standard" as const,
  remainingSeconds: 300,
  status: "idle" as const,
};

describe("PresentationCanvas timer visibility", () => {
  it("keeps teacher controls available when the student timer is hidden", () => {
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerControls={<button type="button">Show timer to students</button>}
      />,
    );

    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={{ ...timer, visible: false }}
        timerControls={<button type="button">Show timer to students</button>}
      />,
    );

    expect(screen.queryByText("5:00")).not.toBeInTheDocument();
    expect(screen.getByText("Timer hidden from students")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();
  });

  it("applies a saved presentation theme to the canvas", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          presentationTheme: { kind: "curated", themeId: "midnight" },
        }}
      />,
    );

    expect(screen.getByTestId("presentation-surface")).toHaveStyle({
      "--presentation-bg": "#0F172A",
      "--presentation-primary-text": "#F8FAFC",
      "--presentation-accent": "#38BDF8",
    });
  });
});