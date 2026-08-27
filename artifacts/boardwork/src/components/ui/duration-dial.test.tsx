import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DurationDial } from "./duration-dial";

describe("DurationDial", () => {
  it("keeps 3, 5, and 7 quick choices beside the integrated 10-minute control", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DurationDial value={7} onChange={onChange} />);

    expect(screen.getByTestId("duration-quick-3")).toBeInTheDocument();
    expect(screen.getByTestId("duration-quick-3")).toHaveClass(
      "flex-col",
      "items-center",
    );
    expect(screen.getByTestId("duration-quick-7")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("duration-quick-5")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("duration-quick-10")).toHaveAttribute("data-selected", "false");
    expect(screen.getByTestId("duration-quick-10")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByTestId("duration-dial-value")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("duration-quick-5"));
    expect(onChange).toHaveBeenCalledWith(5);

    rerender(<DurationDial value={10} onChange={onChange} />);
    expect(screen.getByTestId("duration-quick-10")).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("duration-dial-value")).toHaveAttribute("aria-valuenow", "10");
    expect(screen.queryByText("Scroll")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("duration-quick-10"));
    expect(onChange).toHaveBeenLastCalledWith(10);

    fireEvent.keyDown(screen.getByTestId("duration-dial-value"), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it("fades rounded neighboring values naturally around the centered minute", () => {
    render(<DurationDial value={10} onChange={vi.fn()} />);

    const nearNeighbor = screen.getByTestId("duration-dial-neighbor-9");
    const farNeighbor = screen.getByTestId("duration-dial-neighbor-8");

    expect(nearNeighbor).toHaveClass("rounded-full", "hover:text-foreground");
    expect(farNeighbor).toHaveClass("rounded-full");
    expect(Number(nearNeighbor.style.opacity)).toBeGreaterThan(
      Number(farNeighbor.style.opacity),
    );
    expect(screen.getByTestId("duration-dial-current")).toHaveClass("rounded-full");
    expect(screen.getByTestId("duration-dial-current")).toHaveClass("flex-col");
    expect(nearNeighbor).toHaveClass("whitespace-nowrap", "leading-none");
  });

  it("keeps the integrated control unique when custom quick options include 10", () => {
    render(<DurationDial value={10} onChange={vi.fn()} quickOptions={[3, 5, 7, 10]} />);

    expect(screen.getAllByTestId("duration-quick-10")).toHaveLength(1);
  });

  it("keeps quick presets stable until 10 is selected, then adjusts one shared value", () => {
    for (const quickValue of [3, 5, 7]) {
      const onChange = vi.fn();
      const { rerender, unmount } = render(
        <DurationDial value={quickValue} onChange={onChange} />,
      );
      const tenMinuteControl = screen.getByTestId("duration-quick-10");
      const viewport = screen.getByTestId("duration-dial-viewport");

      fireEvent.wheel(viewport, { deltaY: -40 });
      fireEvent.keyDown(tenMinuteControl, { key: "ArrowUp" });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByTestId("duration-dial-value")).not.toBeInTheDocument();

      fireEvent.click(tenMinuteControl);
      expect(onChange).toHaveBeenLastCalledWith(10);

      rerender(<DurationDial value={10} onChange={onChange} />);
      fireEvent.wheel(viewport, { deltaY: -40 });
      expect(onChange).toHaveBeenLastCalledWith(11);
      rerender(<DurationDial value={11} onChange={onChange} />);
      expect(screen.getByTestId("duration-dial-current")).toHaveTextContent("11");

      fireEvent.keyDown(screen.getByTestId("duration-dial-value"), { key: "ArrowUp" });
      expect(onChange).toHaveBeenLastCalledWith(12);
      rerender(<DurationDial value={12} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("button-increase-duration"));
      expect(onChange).toHaveBeenLastCalledWith(13);

      rerender(<DurationDial value={13} onChange={onChange} />);
      fireEvent.click(screen.getByTestId("duration-dial-current"));
      expect(onChange).toHaveBeenLastCalledWith(10);
      unmount();
    }
  });

  it("adjusts by wheel, explicit controls, and keyboard without leaving whole-minute bounds", () => {
    const onChange = vi.fn();
    render(<DurationDial value={10} onChange={onChange} />);
    const viewport = screen.getByTestId("duration-dial-viewport");
    const dial = screen.getByTestId("duration-dial-value");

    fireEvent.wheel(viewport, { deltaY: -40 });
    expect(onChange).toHaveBeenLastCalledWith(11);
    fireEvent.wheel(viewport, { deltaY: 40 });
    expect(onChange).toHaveBeenLastCalledWith(9);

    fireEvent.click(screen.getByTestId("button-increase-duration"));
    expect(onChange).toHaveBeenLastCalledWith(11);
    fireEvent.click(screen.getByTestId("button-decrease-duration"));
    expect(onChange).toHaveBeenLastCalledWith(9);

    fireEvent.keyDown(dial, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(11);
    fireEvent.keyDown(dial, { key: "PageDown" });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(dial, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(dial, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it("disables endpoint controls and reports a bounded accessible value", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DurationDial value={1} onChange={onChange} />);
    const dial = screen.getByTestId("duration-dial-value");

    expect(dial).toHaveAttribute("role", "spinbutton");
    expect(dial).toHaveAttribute("aria-valuemin", "1");
    expect(dial).toHaveAttribute("aria-valuemax", "60");
    expect(screen.getByTestId("button-decrease-duration")).toBeDisabled();
    expect(screen.getByTestId("button-increase-duration")).not.toBeDisabled();

    rerender(<DurationDial value={60} onChange={onChange} />);
    expect(screen.getByTestId("button-increase-duration")).toBeDisabled();
    expect(screen.getByTestId("button-decrease-duration")).not.toBeDisabled();
    expect(screen.getByTestId("duration-dial-value")).toHaveTextContent("59");
  });

  it("preserves a legacy server-compatible value without pretending it is in the dial range", () => {
    const onChange = vi.fn();
    render(
      <DurationDial
        value={120}
        onChange={onChange}
        compatibilityMessage="This class default is 120 minutes."
      />,
    );

    const dial = screen.getByTestId("duration-dial-value");
    expect(dial).toHaveAttribute("role", "group");
    expect(dial).toHaveAttribute("aria-valuetext", "120 minutes");
    expect(dial).not.toHaveAttribute("aria-valuemax");
    expect(screen.getByTestId("duration-compatibility")).toHaveTextContent(
      "This class default is 120 minutes.",
    );
    expect(screen.getByTestId("duration-dial-value")).toHaveTextContent("120");
    expect(screen.queryByTestId("duration-dial-neighbor-118")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("duration-quick-10"));
    expect(onChange).toHaveBeenCalledWith(10);
  });
});