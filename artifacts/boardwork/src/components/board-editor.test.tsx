import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActivityDraft } from "@/store/boardwork-context";
import { PRESENTATION_IMAGE_FILE_LIMIT_BYTES, PRESENTATION_IMAGE_SIZE_ERROR } from "@workspace/api-zod";
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

  it("keeps the typography picker selection in sync across repeated changes", () => {
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
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));

    for (const typographyId of ["friendly", "editorial", "structured", "clear", "boardwork"]) {
      fireEvent.click(screen.getByTestId(`typography-option-${typographyId}`));

      expect(screen.getByTestId(`typography-option-${typographyId}`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      for (const otherTypographyId of [
        "friendly",
        "editorial",
        "structured",
        "clear",
        "boardwork",
      ]) {
        if (otherTypographyId === typographyId) continue;
        expect(
          screen.getByTestId(`typography-option-${otherTypographyId}`),
        ).toHaveAttribute("aria-pressed", "false");
      }
    }
  });

  it("keeps invalid duration text out of the draft and blocks presenting", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);

    const durationEditor = screen.getByRole("textbox", { name: "7" });
    durationEditor.textContent = "121";
    fireEvent.input(durationEditor);

    expect(screen.getByTestId("duration-error")).toHaveTextContent(
      "Enter a whole number from 1 to 120 minutes.",
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("button-present-disabled")).toBeInTheDocument();

    durationEditor.textContent = "0";
    fireEvent.input(durationEditor);
    expect(onChange).not.toHaveBeenCalled();

    durationEditor.textContent = "120";
    fireEvent.input(durationEditor);
    expect(onChange).toHaveBeenCalledWith({ durationMinutes: 120 });
    expect(screen.queryByTestId("duration-error")).not.toBeInTheDocument();
  });

  it("lets a teacher add, edit, and remove a teacher note", () => {
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
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    expect(screen.queryByPlaceholderText("Optional note for the teacher...")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-add-teacher-note"));
    const noteEditor = screen.getByRole("textbox", {
      name: "Optional note for the teacher...",
    });
    noteEditor.textContent = "Ask for evidence.";
    fireEvent.input(noteEditor);

    expect(noteEditor).toHaveTextContent("Ask for evidence.");
    fireEvent.click(screen.getByTestId("button-remove-teacher-note"));
    expect(screen.queryByPlaceholderText("Optional note for the teacher...")).not.toBeInTheDocument();
  });

  it("rejects an oversized image before it changes the draft", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const oversizedImage = new File(
      [new Uint8Array(PRESENTATION_IMAGE_FILE_LIMIT_BYTES + 1)],
      "too-large.png",
      { type: "image/png" },
    );

    fireEvent.change(fileInput, { target: { files: [oversizedImage] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("visual-upload-error")).toHaveTextContent(
      PRESENTATION_IMAGE_SIZE_ERROR,
    );
  });

  it("keeps the image and retry recovery actions available after a save failure", () => {
    const onChange = vi.fn();
    const onRetrySave = vi.fn();
    render(
      <BoardEditor
        draft={{ ...draft, visualUrl: "data:image/png;base64,preview" }}
        onChange={onChange}
        saveStatus="error"
        saveError={PRESENTATION_IMAGE_SIZE_ERROR}
        onRetrySave={onRetrySave}
      />,
    );

    expect(screen.getByTestId("activity-save-error")).toHaveTextContent(
      PRESENTATION_IMAGE_SIZE_ERROR,
    );
    fireEvent.click(screen.getByTestId("button-retry-activity-save"));
    expect(onRetrySave).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    expect(onChange).toHaveBeenCalledWith({
      visualUrl: null,
      visualDescription: null,
    });
  });
});