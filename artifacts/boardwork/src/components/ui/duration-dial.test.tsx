import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DurationDial } from "./duration-dial";

describe("DurationDial", () => {
  it("keeps quick choices available and marks only 5 or 7 as quick selections", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DurationDial value={7} onChange={onChange} />);

    expect(screen.getByTestId("duration-quick-7")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("duration-quick-5")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("duration-dial-value")).toHaveAttribute("aria-valuenow", "7");

    fireEvent.click(screen.getByTestId("duration-quick-5"));
    expect(onChange).toHaveBeenCalledWith(5);

    rerender(<DurationDial value={10} onChange={onChange} />);
    expect(screen.getByTestId("duration-quick-10")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("duration-dial-value")).toHaveAttribute("aria-valuenow", "10");

    fireEvent.click(screen.getByTestId("duration-quick-10"));
    expect(onChange).toHaveBeenLastCalledWith(10);
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

    fireEvent.click(screen.getByTestId("duration-quick-10"));
    expect(onChange).toHaveBeenCalledWith(10);
  });
});