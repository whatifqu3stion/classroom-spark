import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

describe("SegmentedControl selected appearance", () => {
  it("uses a filled selected state, neutral alternatives, and independent focus", () => {
    const onChange = vi.fn();
    const props = {
      options: [3, 5, 7].map(value => ({ value, label: String(value) })),
      onChange,
      ariaLabel: "Duration",
    };
    const { rerender } = render(<SegmentedControl {...props} value={5} />);
    const selected = screen.getByRole("button", { name: "5", pressed: true });
    expect(selected).toHaveClass("bg-foreground/10", "text-foreground", "border-foreground/25", "dark:bg-foreground/15");
    expect(selected).not.toHaveClass("bg-primary", "text-primary-foreground");
    expect(selected).not.toHaveClass("shadow-sm");
    const next = screen.getByRole("button", { name: "7", pressed: false });
    expect(next).not.toHaveClass("bg-foreground/10");
    expect(next).toHaveClass("hover:bg-background", "focus-visible:ring-2", "border-transparent");
    fireEvent.focus(next);
    expect(selected).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(next);
    expect(onChange).toHaveBeenCalledWith(7);
    rerender(<SegmentedControl {...props} value={7} />);
    expect(screen.getByRole("button", { name: "7", pressed: true })).toHaveClass("bg-foreground/10");
    expect(screen.getByRole("button", { name: "5", pressed: false })).not.toHaveClass("bg-foreground/10");
  });

  it("does not select a preset when its value is custom", () => {
    render(<SegmentedControl options={[3, 5, 7].map(value => ({ value, label: String(value) }))} value={19} onChange={vi.fn()} />);
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });
});