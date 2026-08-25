import { useState } from "react";
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
    expect(screen.getByTestId("presentation-preview")).toBeInTheDocument();
    expect(screen.getByTestId("presentation-preview-surface")).toHaveClass(
      "presentation-surface--editor-preview",
    );
    expect(screen.getByTestId("present-title")).toHaveTextContent("Independent practice");
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Arrival instructions (optional footer)..."),
    ).not.toBeInTheDocument();
  });

  it("updates the student preview immediately from unsaved content and typography", () => {
    function StatefulEditor() {
      const [currentDraft, setCurrentDraft] = useState<ActivityDraft>(draft);

      return (
        <BoardEditor
          draft={currentDraft}
          onChange={(updates) =>
            setCurrentDraft((previous) => ({ ...previous, ...updates }))
          }
        />
      );
    }

    render(<StatefulEditor />);

    const titleEditor = screen.getByRole("textbox", {
      name: "Enter a short title...",
    });
    titleEditor.textContent = "Unsaved preview title";
    fireEvent.input(titleEditor);

    expect(screen.getByTestId("present-title")).toHaveTextContent(
      "Unsaved preview title",
    );

    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    fireEvent.click(screen.getByTestId("typography-option-clear"));

    const previewSurface = screen.getByTestId("presentation-preview-surface");
    expect(
      previewSurface.style.getPropertyValue("--presentation-font-heading"),
    ).toContain("Atkinson Hyperlegible");
    expect(
      previewSurface.style.getPropertyValue("--presentation-font-body"),
    ).toContain("Atkinson Hyperlegible");
  });
});