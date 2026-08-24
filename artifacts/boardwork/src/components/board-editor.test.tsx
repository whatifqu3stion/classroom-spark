import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActivityDraft } from "@/store/boardwork-context";
import { BoardEditor } from "./board-editor";

const draft: ActivityDraft = {
  classId: "class-1",
  title: "Independent practice",
  task: "Work quietly.",
  prompts: ["Explain your thinking."],
  durationMinutes: 5,
  deviceMode: "off",
  presentationTheme: { kind: "curated", themeId: "midnight", accentId: "sage" },
};

describe("BoardEditor presentation visual disclosure", () => {
  it("starts collapsed with a useful summary and reveals all visual controls", () => {
    render(<BoardEditor draft={draft} onChange={vi.fn()} />);

    const toggle = screen.getByTestId("button-toggle-presentation-visual");
    const editor = screen.getByTestId("presentation-visual-editor");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(editor).toHaveAttribute("data-state", "closed");
    expect(editor).toHaveAttribute("aria-hidden", "true");
    expect(editor.children).toHaveLength(1);
    expect(editor.firstElementChild).toHaveClass("space-y-3");
    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.queryByText("No image · Midnight · Mint accent")).not.toBeInTheDocument();
    expect(screen.getByText("Visual presentation colors")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(editor).toHaveAttribute("data-state", "open");
    expect(editor).toHaveAttribute("aria-hidden", "false");
    expect(editor.children).toHaveLength(1);
    expect(screen.getByText("Add image")).toBeInTheDocument();
    expect(screen.getByTestId("presentation-theme-picker")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Arrival instructions (optional footer)..."),
    ).not.toBeInTheDocument();
  });
});