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
        timerVisibilityControl={<button type="button">Show timer to students</button>}
      />,
    );

    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={{ ...timer, visible: false }}
        timerControls={<button type="button">Show timer to students</button>}
        timerVisibilityControl={<button type="button">Show timer to students</button>}
      />,
    );

    expect(screen.queryByText("5:00")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();
    expect(screen.queryByText("Timer hidden from students")).not.toBeInTheDocument();
  });

  it("shows an active alarm to the teacher but omits it from exports", () => {
    const alarmTimer = {
      ...timer,
      remainingSeconds: 0,
      status: "completed" as const,
      alarmActive: true,
    };
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        timer={alarmTimer}
        timerControls={<button type="button">Dismiss alarm</button>}
      />,
    );

    expect(screen.getByText("Alarm active — dismiss when ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss alarm" })).toBeInTheDocument();
    expect(screen.getByText("Alarm active — dismiss when ready").closest(".presentation-timer")).toHaveClass(
      "presentation-timer--alerting",
    );

    rerender(
      <PresentationCanvas
        activity={activity}
        exportLayout
        timer={alarmTimer}
        timerControls={<button type="button">Dismiss alarm</button>}
      />,
    );

    expect(screen.queryByText("Alarm active — dismiss when ready")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss alarm" })).not.toBeInTheDocument();
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
      "--presentation-accent": "#70B7DF",
    });
  });

  it("renders formulas in the student canvas", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          task: "Compare \\(\\frac{1}{2} and \\sqrt{4}\\).",
          prompts: ["Label \\(H_2O and \\alpha\\)."],
        }}
      />,
    );

    expect(screen.getByTestId("present-task").querySelector(".formula-fraction")).toBeInTheDocument();
    expect(screen.getByTestId("present-task").querySelector(".formula-root")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("α")).toBeInTheDocument();
    expect(screen.queryByText(/\\frac|\\sqrt/)).not.toBeInTheDocument();
  });

  it("puts arrival instructions first and the activity name in the header", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          arrivalInstructions: "Start here: read this first.",
        }}
      />,
    );

    const surface = screen.getByTestId("presentation-surface");
    const arrival = screen.getByTestId("present-arrival");
    const header = surface.querySelector(".presentation-header");
    const title = screen.getByTestId("present-title");

    expect(Array.from(surface.children).indexOf(arrival)).toBe(0);
    expect(Array.from(surface.children).indexOf(arrival)).toBeLessThan(
      Array.from(surface.children).indexOf(header as Element),
    );
    expect(title.closest("header")).toBeInTheDocument();
    expect(title.closest("footer")).not.toBeInTheDocument();
    expect(title).toHaveTextContent("Independent practice");
  });

  it("renders formulas in the materials line", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          materials: ["H_2O", "\\alpha"],
        }}
      />,
    );

    const materials = screen.getByTestId("present-materials");
    expect(materials.querySelector(".formula-script > sub")).toBeInTheDocument();
    expect(materials.querySelector(".formula-rendered")).toBeInTheDocument();
    expect(materials).toHaveTextContent("Materials: H2O, α");
    expect(materials).not.toHaveTextContent("H_2O");
  });

  it("keeps multilingual content intact and marks authored runs direction-aware", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          eyebrow: "Décrire • الصف ٦",
          title: "e\u0301lan del agua • الماء",
          task: "اقرأ النص ثم اشرح: 日本語の観察。",
          prompts: ["नमस्ते — اكتب دليلاً."],
        }}
      />,
    );

    expect(screen.getByTestId("present-title")).toHaveAttribute("dir", "auto");
    expect(screen.getByTestId("present-task")).toHaveAttribute("dir", "auto");
    expect(screen.getByTestId("present-title")).toHaveTextContent("e\u0301lan del agua • الماء");
    expect(screen.getByTestId("present-task")).toHaveTextContent("اقرأ النص ثم اشرح: 日本語の観察。");
    expect(screen.getByText("नमस्ते — اكتب دليلاً.").closest("[dir='auto']")).toBeTruthy();
  });
});