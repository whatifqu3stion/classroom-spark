import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  it("keeps the live rail modes and child surfaces separate", () => {
    const visualActivity = {
      ...activity,
      visualUrl: "data:image/png;base64,visual",
      visualDescription: "A visual for the live board",
    };
    const { rerender } = render(
      <PresentationCanvas activity={visualActivity} timer={timer} />,
    );

    const splitRail = screen.getByRole("complementary");
    expect(splitRail).toHaveClass("presentation-rail--split");
    expect(splitRail.querySelector(".presentation-visual")).toBeInTheDocument();
    expect(splitRail.querySelector(".presentation-timer")).toBeInTheDocument();
    expect(splitRail.querySelector(".presentation-visual img")).toHaveAttribute(
      "src",
      visualActivity.visualUrl,
    );
    expect(splitRail.querySelector(".presentation-visual-caption")).toHaveTextContent(
      visualActivity.visualDescription,
    );

    rerender(
      <PresentationCanvas
        activity={visualActivity}
        timer={{ ...timer, visible: false }}
      />,
    );
    const imageOnlyRail = screen.getByRole("complementary");
    expect(imageOnlyRail).toHaveClass("presentation-rail--image-only");
    expect(imageOnlyRail.querySelector(".presentation-visual")).toBeInTheDocument();
    expect(imageOnlyRail.querySelector(".presentation-timer")).not.toBeInTheDocument();

    rerender(<PresentationCanvas activity={activity} timer={timer} />);
    const timerOnlyRail = screen.getByRole("complementary");
    expect(timerOnlyRail).toHaveClass("presentation-rail--timer-only");
    expect(timerOnlyRail.querySelector(".presentation-visual")).not.toBeInTheDocument();
    expect(timerOnlyRail.querySelector(".presentation-timer")).toBeInTheDocument();
  });

  it("keeps teacher controls available when the student timer is hidden", () => {
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        controls={<button type="button">Pause timer</button>}
      />,
    );

    expect(screen.getByText("5:00")).toBeInTheDocument();
    expect(screen.queryByText("5 MIN")).not.toBeInTheDocument();
    expect(screen.queryByTestId("present-time")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause timer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause timer" }).closest(".presentation-footer"))
      .toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        onShowTimer={() => undefined}
        timer={{ ...timer, visible: false }}
        controls={<button type="button">Start timer</button>}
      />,
    );

    expect(screen.queryByText("5:00")).not.toBeInTheDocument();
    expect(screen.queryByText("5 MIN")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer" }).closest(".presentation-timer"),
    ).not.toBeInTheDocument();
  });

  it("keeps the hidden timer clock-only and restores the compact timer on request", () => {
    const onShowTimer = vi.fn();
    render(
      <PresentationCanvas
        activity={activity}
        onShowTimer={onShowTimer}
        timer={{ ...timer, visible: false, remainingSeconds: 42, status: "running" }}
        controls={<button type="button">Start timer</button>}
      />,
    );

    expect(screen.queryByText("Time remaining")).not.toBeInTheDocument();
    expect(screen.queryByText("Timer hidden from students")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer to students" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer" }).closest(".presentation-time"),
    ).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Show timer to students" }).click();
    expect(onShowTimer).toHaveBeenCalledOnce();
  });

  it("restores the unchanged live reading after student visibility is toggled", () => {
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        onShowTimer={() => undefined}
        timer={{ ...timer, visible: false, remainingSeconds: 42, status: "running" }}
      />,
    );

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={{ ...timer, remainingSeconds: 42, status: "running" }}
        timerMinimized
      />,
    );

    expect(screen.getByText("0:42").closest(".presentation-time")).toBeInTheDocument();
    expect(screen.queryByText("Time remaining")).not.toBeInTheDocument();
  });

  it("keeps the large timer in the right rail and provides the compact teacher path when minimized", () => {
    const onToggleTimerControls = vi.fn();
    const timerControls = <button type="button">Start timer</button>;
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        controls={
          <div>
            <button type="button">Start timer</button>
            <button type="button">Minimize timer</button>
          </div>
        }
        timerControls={timerControls}
      />,
    );

    expect(screen.getByText("Time remaining")).toBeInTheDocument();
    expect(screen.getByText("5:00").closest(".presentation-timer")).toBeInTheDocument();
    expect(screen.queryByTestId("present-time")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start timer" }).closest(".presentation-footer"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minimize timer" })).toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerMinimized
        timerControlsOpen={false}
        onToggleTimerControls={onToggleTimerControls}
        controls={<button type="button">Expand timer</button>}
        timerControls={timerControls}
      />,
    );

    expect(screen.queryByText("Time remaining")).not.toBeInTheDocument();
    expect(screen.getByTestId("present-time").querySelector(".presentation-time-reading")).toHaveTextContent(
      "5:00",
    );
    expect(screen.queryByRole("button", { name: "Expand timer" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer", hidden: true }).closest(
        ".presentation-time-compact-controls",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show timer controls" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    screen.getByRole("button", { name: "Show timer controls" }).click();
    expect(onToggleTimerControls).toHaveBeenCalledOnce();

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerMinimized
        timerControlsOpen
        onToggleTimerControls={onToggleTimerControls}
        controls={<button type="button">Expand timer</button>}
        timerControls={<button type="button">Start timer</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Expand timer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide timer controls" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("keeps a four-digit duration inside the compact teacher-facing affordance", () => {
    render(
      <PresentationCanvas
        activity={{ ...activity, durationMinutes: 1000 }}
        timer={{ ...timer, remainingSeconds: 60000 }}
        timerMinimized
        controls={<button type="button">Start timer</button>}
      />,
    );

    const reading = screen.getByText("1000:00");
    expect(reading).toHaveClass("presentation-time-reading");
    expect(reading).toHaveStyle({
      "--presentation-time-reading-scale": "0.5714285714285714",
    });
    expect(reading.closest(".presentation-timer")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start timer" }),
    ).toBeInTheDocument();
  });

  it("shows a semantic compact countdown ring using the configured duration", () => {
    const { rerender } = render(
      <PresentationCanvas
        activity={{
          ...activity,
          presentationTheme: { kind: "curated", themeId: "midnight" },
        }}
        timer={{ ...timer, remainingSeconds: 150, status: "running" }}
        timerMinimized
      />,
    );

    const progress = screen.getByRole("progressbar", { name: "Time remaining" });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "300");
    expect(progress).toHaveAttribute("aria-valuenow", "150");
    expect(progress).toHaveAttribute("aria-valuetext", "2:30 remaining");
    expect(screen.getByTestId("presentation-surface")).toHaveStyle({
      "--presentation-accent": "#70B7DF",
      "--presentation-accent-soft": "#1D2D43",
    });
    expect(
      screen.getByTestId("compact-timer-progress").querySelector(
        ".presentation-time-compact-ring-progress",
      ),
    ).toHaveStyle({ strokeDashoffset: "50" });

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={{ ...timer, remainingSeconds: 0, status: "completed" }}
        timerMinimized
      />,
    );

    expect(progress).toHaveAttribute("aria-valuetext", "Time is up");
    expect(screen.getByTestId("compact-timer-progress")).toHaveClass(
      "presentation-time-compact-shell--completed",
    );
    expect(
      screen.getByTestId("compact-timer-progress").querySelector(
        ".presentation-time-compact-ring-progress",
      ),
    ).toHaveStyle({ strokeDashoffset: "100" });
  });

  it("keeps the compact ring and enlarged reading inside its presentation control", () => {
    render(
      <PresentationCanvas
        activity={activity}
        timer={{ ...timer, remainingSeconds: 42, status: "paused" }}
        timerMinimized
      />,
    );

    const shell = screen.getByTestId("compact-timer-progress");
    const toggle = screen.getByTestId("button-toggle-timer-controls");
    expect(shell).toContainElement(toggle);
    expect(screen.getByText("0:42")).toHaveClass("presentation-time-reading");
    expect(
      shell.querySelector(".presentation-time-compact-ring"),
    ).toHaveAttribute("role", "progressbar");
  });

  it("scales longer readings so unbounded durations remain inside the ring", () => {
    render(
      <PresentationCanvas
        activity={{ ...activity, durationMinutes: 100 }}
        timer={{ ...timer, remainingSeconds: 6000 }}
        timerMinimized
      />,
    );

    expect(screen.getByText("100:00")).toHaveStyle({
      "--presentation-time-reading-scale": "0.6666666666666666",
    });
    expect(screen.getByRole("progressbar", { name: "Time remaining" })).toHaveAttribute(
      "aria-valuemax",
      "6000",
    );
  });

  it("keeps compact timer actions out of the student canvas", () => {
    const onToggleTimerControls = vi.fn();
    render(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerMinimized
        timerControlsOpen={false}
        onToggleTimerControls={onToggleTimerControls}
        timerControls={<button type="button">Start timer</button>}
      />,
    );

    const compactToggle = screen.getByTestId("button-toggle-timer-controls");
    expect(compactToggle).toHaveAttribute("aria-controls", "presentation-timer-controls-panel");
    expect(
      screen.getByTestId("present-timer-controls-panel").closest(".presentation-time"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("present-timer-controls-panel")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    fireEvent.click(compactToggle);
    expect(onToggleTimerControls).toHaveBeenCalledOnce();
    expect(
      screen.getByTestId("present-timer-controls-panel"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the compact timer disclosure independent from the teacher dock", () => {
    const onCloseTimerControls = vi.fn();
    const { rerender } = render(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerMinimized
        timerControlsOpen={false}
        onToggleTimerControls={() => undefined}
        onCloseTimerControls={onCloseTimerControls}
        controls={<button type="button">Open resource</button>}
        timerControls={<button type="button">Start timer</button>}
      />,
    );

    const timerPanel = screen.getByTestId("present-timer-controls-panel");
    expect(timerPanel).toHaveAttribute("id", "presentation-timer-controls-panel");
    expect(timerPanel).toHaveAttribute("aria-hidden", "true");
    expect(timerPanel).toContainElement(
      screen.getByRole("button", { name: "Start timer", hidden: true }),
    );
    expect(screen.getByRole("button", { name: "Open resource" }).closest(".presentation-footer"))
      .toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        timer={timer}
        timerMinimized
        timerControlsOpen
        onToggleTimerControls={() => undefined}
        onCloseTimerControls={onCloseTimerControls}
        controls={<button type="button">Open resource</button>}
        timerControls={<button type="button">Start timer</button>}
      />,
    );

    expect(timerPanel).toHaveAttribute("aria-hidden", "false");
    fireEvent.keyDown(timerPanel, { key: "Escape" });
    expect(onCloseTimerControls).toHaveBeenCalledOnce();
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
        controls={<button type="button">Dismiss alarm</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Dismiss alarm" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Timer alarm" })).toHaveTextContent(
      "Alarm active — dismiss when ready",
    );
    expect(screen.getByRole("status", { name: "Timer alarm" }).closest(".presentation-footer"))
      .toBeInTheDocument();

    rerender(
      <PresentationCanvas
        activity={activity}
        exportLayout
        timer={alarmTimer}
        controls={<button type="button">Dismiss alarm</button>}
      />,
    );

    expect(screen.queryByRole("status", { name: "Timer alarm" })).not.toBeInTheDocument();
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

  it("resolves missing and invalid appearances to the Boardwork default", () => {
    const { rerender } = render(
      <PresentationCanvas activity={activity} />,
    );
    const surface = screen.getByTestId("presentation-surface");

    expect(surface.style.getPropertyValue("--presentation-bg")).toBe("#FDFCF8");
    expect(surface.style.getPropertyValue("--presentation-accent")).toBe("#334155");
    expect(surface.style.getPropertyValue("--presentation-font-heading")).toContain(
      "'Inter'",
    );
    expect(surface.style.getPropertyValue("--presentation-font-body")).toContain(
      "'Inter'",
    );

    rerender(
      <PresentationCanvas
        activity={{
          ...activity,
          presentationTheme: {
            kind: "curated",
            themeId: "not-a-theme",
            accentId: "not-an-accent",
            typographyId: "clear",
          },
        }}
      />,
    );

    expect(surface.style.getPropertyValue("--presentation-bg")).toBe("#FDFCF8");
    expect(surface.style.getPropertyValue("--presentation-accent")).toBe("#334155");
    expect(surface.style.getPropertyValue("--presentation-font-heading")).toContain("'Inter'");
    expect(surface.style.getPropertyValue("--presentation-font-body")).toContain("'Inter'");
  });

  it("keeps the fixed pairing identical in editor preview and PNG export", () => {
    const { rerender } = render(
      <PresentationCanvas
        activity={{
          ...activity,
          presentationTheme: {
            kind: "curated",
            themeId: "paper-v2",
            typographyId: "editorial",
          },
        }}
        editorPreview
      />,
    );

    const preview = screen.getByTestId("presentation-preview-surface");
    const previewTypography = {
      heading: preview.style.getPropertyValue("--presentation-font-heading"),
      body: preview.style.getPropertyValue("--presentation-font-body"),
      headingWeight: preview.style.getPropertyValue("--presentation-heading-weight"),
      bodyWeight: preview.style.getPropertyValue("--presentation-body-weight"),
    };

    rerender(
      <PresentationCanvas
        activity={{
          ...activity,
          presentationTheme: {
            kind: "curated",
            themeId: "paper-v2",
            typographyId: "editorial",
          },
        }}
        exportLayout
      />,
    );

    const exportSurface = document.querySelector(
      ".presentation-surface--export",
    ) as HTMLElement;
    expect(exportSurface).toBeInTheDocument();
    expect({
      heading: exportSurface.style.getPropertyValue("--presentation-font-heading"),
      body: exportSurface.style.getPropertyValue("--presentation-font-body"),
      headingWeight: exportSurface.style.getPropertyValue("--presentation-heading-weight"),
      bodyWeight: exportSurface.style.getPropertyValue("--presentation-body-weight"),
    }).toEqual(previewTypography);
  });

  it("uses the shared student structure without timer state in editor preview mode", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          arrivalInstructions: "Read this first.",
          visualUrl: "data:image/png;base64,preview",
          visualDescription: "A preview image",
        }}
        editorPreview
        timer={{ ...timer, visible: false }}
        onShowTimer={vi.fn()}
        controls={<button type="button">Teacher controls</button>}
      />,
    );

    expect(screen.getByTestId("presentation-preview-surface")).toBeInTheDocument();
    expect(screen.getByTestId("present-arrival")).toHaveTextContent("Read this first.");
    expect(screen.getByTestId("present-title")).toHaveTextContent("Independent practice");
    expect(screen.queryByText("5 MIN")).not.toBeInTheDocument();
    expect(screen.queryByTestId("present-time")).not.toBeInTheDocument();
    expect(screen.queryByText("Time remaining")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pause timer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();
  });

  it("keeps teacher controls in live Present only", () => {
    const controls = <button type="button">Teacher controls</button>;
    const { rerender } = render(
      <PresentationCanvas activity={activity} controls={controls} />,
    );

    expect(screen.getByRole("button", { name: "Teacher controls" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Teacher controls" }).closest(".presentation-footer"),
    ).toBeInTheDocument();

    rerender(
      <PresentationCanvas activity={activity} controls={controls} editorPreview />,
    );
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();

    rerender(
      <PresentationCanvas activity={activity} controls={controls} exportLayout />,
    );
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();
  });

  it("can move the resource link out of the student canvas while keeping its note", () => {
    const resourceActivity = {
      ...activity,
      resourceUrl: "https://example.com/resource",
      resourceNote: "Use the linked reading for context.",
    };
    const { rerender } = render(
      <PresentationCanvas activity={resourceActivity} />,
    );

    expect(screen.getByTestId("present-resource-link")).toHaveAttribute(
      "href",
      "https://example.com/resource",
    );

    rerender(
      <PresentationCanvas
        activity={resourceActivity}
        showResourceLink={false}
      />,
    );

    expect(screen.queryByTestId("present-resource-link")).not.toBeInTheDocument();
    expect(screen.getByTestId("present-resource")).toHaveTextContent(
      "Use the linked reading for context.",
    );

    rerender(
      <PresentationCanvas activity={resourceActivity} exportLayout />,
    );
    expect(screen.queryByTestId("present-resource-link")).not.toBeInTheDocument();
    expect(screen.getByText("Use the linked reading for context.")).toBeInTheDocument();
  });

  it("keeps a saved local image in both preview and export surfaces", () => {
    const imageActivity = {
      ...activity,
      visualUrl: "data:image/png;base64,saved-image",
      visualDescription: "A saved classroom image",
    };
    const { rerender } = render(
      <PresentationCanvas activity={imageActivity} editorPreview />,
    );

    expect(screen.getByRole("img", { name: "A saved classroom image" })).toHaveAttribute(
      "src",
      imageActivity.visualUrl,
    );

    rerender(<PresentationCanvas activity={imageActivity} exportLayout />);

    expect(screen.getByRole("img", { name: "A saved classroom image" })).toHaveAttribute(
      "src",
      imageActivity.visualUrl,
    );
    expect(screen.getByText("A saved classroom image")).toBeInTheDocument();
  });

  it("keeps extreme visual framing and captions in preview and export modes", () => {
    const imageActivity = {
      ...activity,
      visualUrl: "data:image/svg+xml;charset=utf-8,portrait",
      visualDescription:
        "A tall portrait classroom visual with a long teacher-authored explanation that should wrap below the image without changing the image containment or escaping the presentation rail.",
    };
    const { rerender } = render(
      <PresentationCanvas activity={imageActivity} editorPreview />,
    );

    const previewFigure = screen
      .getByRole("img", { name: imageActivity.visualDescription })
      .closest("figure");
    expect(previewFigure).toHaveClass("presentation-visual");
    expect(previewFigure?.querySelector("figcaption")).toHaveClass(
      "presentation-visual-caption",
    );
    expect(previewFigure).toContainElement(
      screen.getByText(imageActivity.visualDescription),
    );
    expect(previewFigure?.querySelector("img")).toHaveAttribute(
      "src",
      imageActivity.visualUrl,
    );

    rerender(<PresentationCanvas activity={imageActivity} exportLayout />);

    const exportFigure = screen
      .getByRole("img", { name: imageActivity.visualDescription })
      .closest("figure");
    expect(exportFigure).toHaveClass("presentation-visual");
    expect(exportFigure).toContainElement(
      screen.getByText(imageActivity.visualDescription),
    );
    expect(exportFigure?.querySelector("img")).toHaveAttribute(
      "src",
      imageActivity.visualUrl,
    );
  });

  it("provides an ephemeral, bounded divider for live and editor surfaces", () => {
    const imageActivity = {
      ...activity,
      visualUrl: "data:image/png;base64,saved-image",
    };
    const { rerender } = render(
      <PresentationCanvas activity={imageActivity} />,
    );

    const divider = screen.getByRole("separator", {
      name: "Resize student content and right rail",
    });
    expect(divider).toHaveAttribute("aria-orientation", "vertical");
    expect(divider).toHaveAttribute("aria-valuemin", "42");
    expect(divider).toHaveAttribute("aria-valuemax", "76");
    expect(divider).toHaveAttribute("aria-valuenow", "64");
    expect(divider).toHaveAttribute(
      "aria-valuetext",
      "64% student content, 36% right rail",
    );
    expect(divider).toHaveAttribute("tabindex", "0");
    expect(screen.getByTestId("presentation-surface")).toHaveStyle({
      "--presentation-content-flex": "0.64fr",
      "--presentation-rail-flex": "0.36fr",
    });

    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider).toHaveAttribute("aria-valuenow", "68");
    fireEvent.keyDown(divider, { key: "End" });
    expect(divider).toHaveAttribute("aria-valuenow", "76");
    fireEvent.keyDown(divider, { key: "Home" });
    expect(divider).toHaveAttribute("aria-valuenow", "64");

    rerender(<PresentationCanvas activity={imageActivity} editorPreview />);
    expect(
      screen.getByRole("separator", {
        name: "Resize student content and right rail",
      }),
    ).toBeInTheDocument();

    rerender(<PresentationCanvas activity={imageActivity} exportLayout />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("updates the divider from pointer dragging without changing authored activity", () => {
    const imageActivity = {
      ...activity,
      visualUrl: "data:image/png;base64,saved-image",
    };
    render(<PresentationCanvas activity={imageActivity} />);

    const main = screen.getByTestId("presentation-surface").querySelector(
      ".presentation-main",
    ) as HTMLElement;
    Object.defineProperty(main, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 600,
        width: 1000,
        height: 600,
      }),
    });
    const divider = screen.getByTestId("presentation-layout-divider");

    fireEvent.pointerDown(divider, {
      clientX: 500,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerMove(divider, {
      clientX: 700,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerUp(divider, { pointerId: 1, pointerType: "touch" });

    expect(divider).toHaveAttribute("aria-valuenow", "70");
    expect(screen.getByTestId("present-title")).toHaveTextContent(
      imageActivity.title,
    );
  });

  it("keeps keyboard resizing inside measured pane minimums near the stacking breakpoint", () => {
    const imageActivity = {
      ...activity,
      visualUrl: "data:image/png;base64,saved-image",
    };
    render(<PresentationCanvas activity={imageActivity} />);

    const surface = screen.getByTestId("presentation-surface");
    const main = surface.querySelector(".presentation-main") as HTMLElement;
    Object.defineProperty(main, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 560,
        height: 400,
      }),
    });
    fireEvent(window, new Event("resize"));

    const divider = screen.getByTestId("presentation-layout-divider");
    expect(divider).toHaveAttribute("aria-valuemin", "50");
    expect(divider).toHaveAttribute("aria-valuemax", "57");

    fireEvent.keyDown(divider, { key: "End" });
    expect(divider).toHaveAttribute("aria-valuenow", "57");
    expect(divider).toHaveAttribute("aria-valuemax", "57");

    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider).toHaveAttribute("aria-valuenow", "57");
    expect(screen.getByTestId("present-title")).toHaveTextContent(
      imageActivity.title,
    );
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

  it("renders prompt lists with bullets", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          prompts: ["First prompt", "Second prompt", "Third prompt"],
        }}
      />,
    );

    const markers = Array.from(
      screen
        .getByTestId("presentation-surface")
        .querySelectorAll(".presentation-prompt-marker"),
    );

    expect(markers).toHaveLength(3);
    expect(markers.every((marker) => marker.textContent === "•")).toBe(true);
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.queryByText("02")).not.toBeInTheDocument();
    expect(screen.queryByText("03")).not.toBeInTheDocument();
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
    const header = screen.getByTestId("presentation-surface").querySelector(".presentation-header");
    const title = screen.getByTestId("present-title");

    expect(Array.from(surface.children).indexOf(arrival)).toBe(0);
    expect(Array.from(surface.children).indexOf(arrival)).toBeLessThan(
      Array.from(surface.children).indexOf(header as Element),
    );
    expect(title.closest("header")).toBeInTheDocument();
    expect(title.closest("footer")).not.toBeInTheDocument();
    expect(title.closest(".presentation-header-copy")).toBeInTheDocument();
    expect(header?.children).toHaveLength(1);
    expect(title).toHaveTextContent("Independent practice");
  });

  it("keeps a no-eyebrow title in the left header stack without a duration column", () => {
    render(<PresentationCanvas activity={activity} />);

    const header = screen.getByTestId("presentation-surface").querySelector(".presentation-header");
    const title = screen.getByTestId("present-title");

    expect(screen.queryByTestId("present-eyebrow")).not.toBeInTheDocument();
    expect(screen.queryByText("5 MIN")).not.toBeInTheDocument();
    expect(screen.queryByTestId("present-time")).not.toBeInTheDocument();
    expect(title.closest(".presentation-header-copy")).toBeInTheDocument();
    expect(header?.children[0]).toContainElement(title);
    expect(header?.children).toHaveLength(1);
  });

  it("renders a formula-bearing title as an h1 in the header stack", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          eyebrow: "Notice",
          title: "Energy: \\(E = mc^2\\)",
        }}
      />,
    );

    const title = screen.getByTestId("present-title");

    expect(title.tagName).toBe("H1");
    expect(title.closest(".presentation-header-copy")).toBeInTheDocument();
    expect(title.querySelector(".formula-rendered")).toBeInTheDocument();
    expect(title).not.toHaveTextContent("\\(E = mc^2\\)");
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

  it("preserves all classroom scripts in the PNG export layout", () => {
    render(
      <PresentationCanvas
        activity={{
          ...activity,
          eyebrow: "العربية • עברית",
          title: "Multilingual classroom board",
          task: "اقرأ النص ثم اشرح.",
          prompts: ["שלום עולם", "नमस्ते दुनिया", "日本語の観察"],
        }}
        exportLayout
      />,
    );

    const exportSurface = document.querySelector(".presentation-surface--export");
    const eyebrow = exportSurface?.querySelector(".presentation-eyebrow");
    const title = exportSurface?.querySelector(".presentation-header-title");
    const task = exportSurface?.querySelector(".presentation-task");
    const promptRuns = Array.from(
      exportSurface?.querySelectorAll(
        ".presentation-prompts > li > .boardwork-user-content",
      ) ?? [],
    );

    expect(exportSurface).toBeInTheDocument();
    expect(exportSurface).not.toHaveTextContent("5 MIN");
    expect(exportSurface?.querySelector(".presentation-time")).not.toBeInTheDocument();
    expect(eyebrow).toHaveAttribute("dir", "auto");
    expect(eyebrow).toHaveTextContent("العربية • עברית");
    expect(title).toHaveAttribute("dir", "auto");
    expect(title).toHaveTextContent("Multilingual classroom board");
    expect(task).toHaveAttribute("dir", "auto");
    expect(task).toHaveTextContent("اقرأ النص ثم اشرح.");
    expect(promptRuns).toHaveLength(3);

    ["שלום עולם", "नमस्ते दुनिया", "日本語の観察"].forEach(
      (expectedText, index) => {
        expect(promptRuns[index]).toHaveAttribute("dir", "auto");
        expect(promptRuns[index]).toHaveTextContent(expectedText);
      },
    );
  });
});
