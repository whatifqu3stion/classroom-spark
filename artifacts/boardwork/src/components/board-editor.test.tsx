import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("exposes the saved context snapshot without opening presentation settings", async () => {
    const label = "A".repeat(50);
    const details = "Original context: draw before explaining.";
    render(<BoardEditor draft={{
      ...draft,
      id: "snapshot-board",
      savedContextSnapshot: [{ label, details, category: "Routine" }],
    }} onChange={vi.fn()} />);
    const inspector = screen.getByTestId("saved-context-snapshot-details");
    expect(inspector.closest("[inert]")).toBeNull();
    expect(inspector.closest('[aria-hidden="true"]')).toBeNull();
    fireEvent.click(screen.getByTestId("button-toggle-snapshot"));
    await waitFor(() => expect(screen.getByText(details)).toBeVisible());
    expect(screen.getByText(label)).not.toHaveClass("truncate");
    expect(screen.getByTestId("button-toggle-presentation-visual")).toHaveAttribute("aria-expanded", "false");
  });

  it("uses a narrow-screen-safe header and content column", () => {
    render(
      <BoardEditor
        draft={{ ...draft, id: "activity-1" }}
        onChange={vi.fn()}
        saveStatus="saved"
      />,
    );

    expect(screen.getByTestId("board-editor")).toHaveClass("min-w-0");
    expect(screen.getByTestId("board-editor")).toHaveClass("min-h-0", "flex-auto");
    expect(screen.getByTestId("board-editor-content")).toHaveClass(
      "min-h-0", "flex-auto", "overflow-y-auto", "p-3", "sm:p-6", "md:p-10",
    );
    expect(screen.getByTestId("board-editor")).not.toHaveClass(
      "rounded-[14px]",
      "border",
      "shadow-sm",
    );
    expect(screen.getByTestId("board-editor-header")).toHaveClass(
      "flex-col",
      "sm:flex-row",
      "border-b",
      "px-5",
      "py-4",
      "lg:px-6",
      "shrink-0",
    );
    expect(screen.getByTestId("board-editor-header")).not.toHaveClass("bg-muted/30");
    expect(screen.getByTestId("text-save-status")).toHaveTextContent("Saved");
    expect(screen.getByTestId("button-present")).toHaveClass(
      "w-full",
      "sm:w-auto",
      "bg-primary",
      "text-primary-foreground",
    );
    expect(screen.queryByRole("textbox", { name: "Enter a short title..." })).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: "Describe the main task for students...",
      }),
    ).toBeVisible();
  });

  it("starts collapsed and reveals visual controls without an embedded board preview", () => {
    render(<BoardEditor draft={draft} onChange={vi.fn()} />);

    const toggle = screen.getByTestId("button-toggle-presentation-visual");
    const editor = screen.getByTestId("presentation-visual-editor");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", editor.id);
    expect(editor).toHaveAttribute("inert");
    expect(screen.getByTestId("presentation-settings-chevron")).not.toHaveClass("rotate-180");
    expect(editor).toHaveAttribute("data-state", "closed");
    expect(editor).toHaveAttribute("aria-hidden", "true");
    expect(editor.children).toHaveLength(1);
    expect(editor.firstElementChild).toHaveClass("space-y-6");
    expect(editor.firstElementChild).not.toHaveClass("pt-5");
    expect(screen.queryByText("No image")).not.toBeInTheDocument();
    expect(screen.queryByText("Image added")).not.toBeInTheDocument();
    expect(toggle).toHaveAccessibleName("Open presentation settings");
    expect(toggle).toHaveTextContent("Presentation settings");
    expect(screen.getByText("Visual presentation colors")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(editor).not.toHaveAttribute("inert");
    expect(editor.firstElementChild).toHaveClass("pt-5");
    expect(screen.getByTestId("presentation-settings-chevron")).toHaveClass("rotate-180");
    expect(editor).toHaveAttribute("data-state", "open");
    expect(editor).toHaveAttribute("aria-hidden", "false");
    expect(editor.children).toHaveLength(1);
     expect(screen.getByLabelText("Add image")).toBeInTheDocument();
     expect(screen.queryByTestId("image-selector-1")).not.toBeInTheDocument();
     expect(screen.getByText(/Add up to 2 local images/)).toBeInTheDocument();
    expect(screen.getByTestId("presentation-theme-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-preview-surface")).not.toBeInTheDocument();
    expect(toggle).toHaveAccessibleName("Close presentation settings");
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Arrival instructions (optional footer)..."),
    ).not.toBeInTheDocument();
  });

  it("presents visual settings as a full-width neutral disclosure with separate guidance", async () => {
    render(<BoardEditor draft={draft} onChange={vi.fn()} />);

    const toggle = screen.getByTestId("button-toggle-presentation-visual");

    expect(toggle).toHaveClass("flex-1", "min-w-0", "min-h-11", "bg-card", "focus-visible:ring-2");
    expect(toggle).not.toHaveClass("shadow-xs", "bg-primary");
    expect(screen.getByTestId("presentation-settings-chevron")).toHaveClass("motion-reduce:transition-none");
    expect(toggle).not.toContainElement(screen.getByRole("button", { name: "About presentation settings" }));

    fireEvent.focus(screen.getByRole("button", { name: "About presentation settings" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "add up to two local images, choose presentation colors, and add a teacher note",
      );
    });
  });

  it("keeps the visual settings separate from the editable board content", () => {
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

    expect(screen.queryByRole("textbox", { name: "Enter a short title..." })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));

    expect(screen.queryByTestId("presentation-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-preview-surface")).not.toBeInTheDocument();
  });

  it("keeps invalid duration text out of the draft while allowing four-digit custom lengths", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);

    const durationEditor = screen.getByRole("textbox", { name: "7" });
    durationEditor.textContent = "0";
    fireEvent.input(durationEditor);

    expect(screen.getByTestId("duration-error")).toHaveTextContent(
      "Enter a whole number of minutes.",
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("button-present-disabled")).toBeInTheDocument();

    durationEditor.textContent = "not-a-number";
    fireEvent.input(durationEditor);
    expect(onChange).not.toHaveBeenCalled();

    durationEditor.textContent = "1000";
    fireEvent.input(durationEditor);
    expect(onChange).toHaveBeenCalledWith({ durationMinutes: 1000 });
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
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    expect(screen.getByTestId("presentation-visual-editor")).toHaveAttribute("inert");
    expect(screen.getByTestId("presentation-settings-chevron")).not.toHaveClass("rotate-180");
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    expect(screen.getByRole("textbox", { name: "Optional note for the teacher..." })).toHaveTextContent("Ask for evidence.");
    fireEvent.click(screen.getByTestId("button-remove-teacher-note"));
    expect(screen.queryByPlaceholderText("Optional note for the teacher...")).not.toBeInTheDocument();
  });

  it("rejects an oversized image before it changes the draft", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));

    const fileInput = screen.getByLabelText("Add image");
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

  it("keeps both image previews, captions, palette, note, and disclosure state together", async () => {
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

     fireEvent.change(screen.getByLabelText("Add image"), {
      target: {
        files: [new File(["first"], "first.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
       expect(screen.getAllByTestId("visual-preview")).toHaveLength(1),
    );

    const firstDescription = screen.getByRole("textbox", {
      name: "Visual description 1",
    });
    fireEvent.change(firstDescription, {
      target: { value: "First classroom visual" },
    });
     expect(firstDescription).toHaveValue("First classroom visual");

     fireEvent.change(screen.getByLabelText("Add image"), {
      target: {
        files: [new File(["second"], "second.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
       expect(screen.getAllByTestId("visual-preview")).toHaveLength(2),
    );

     expect(screen.getAllByTestId("visual-preview")).toHaveLength(2);
     expect(screen.queryByLabelText("Add image")).not.toBeInTheDocument();
     expect(screen.getByTestId("presentation-visual-editor-content")).toHaveTextContent(
       "Two images keep the timer small",
     );
     fireEvent.click(screen.getByTestId("theme-option-paper"));
     fireEvent.click(screen.getByTestId("button-add-teacher-note"));
     const teacherNote = screen.getByRole("textbox", {
       name: "Optional note for the teacher...",
     });
     teacherNote.textContent = "Keep the comparison brief.";
     fireEvent.input(teacherNote);
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
    fireEvent.click(screen.getByTestId("button-toggle-presentation-visual"));
     expect(screen.getAllByTestId("visual-preview")).toHaveLength(2);
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue("First classroom visual");
    expect(screen.getByTestId("theme-option-paper")).toHaveAttribute("aria-pressed", "true");
     expect(screen.getByRole("textbox", { name: "Optional note for the teacher..." })).toHaveTextContent(
       "Keep the comparison brief.",
     );

     expect(screen.getByRole("textbox", { name: "Visual description 2" })).toHaveValue("");
     expect(screen.queryByText(/Replace image/)).not.toBeInTheDocument();
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
     fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
    expect(onChange).toHaveBeenCalledWith({
      visuals: [],
      visualUrl: null,
      visualDescription: null,
    });
  });
});

describe("BoardEditor Present Screen action", () => {
  it("gives the enabled action stronger weight while preserving its route and callback", () => {
    const onPresent = vi.fn();
    render(
      <BoardEditor
        draft={{ ...draft, id: "activity-1" }}
        onChange={vi.fn()}
        onPresent={onPresent}
      />,
    );

    const presentButton = screen.getByTestId("button-present");
    expect(presentButton).toHaveAttribute("href", "/present/activity-1");
    expect(presentButton).toHaveClass(
      "h-10",
      "rounded-lg",
      "font-semibold",
      "shadow-sm",
      "hover:bg-primary/80",
      "hover:shadow-md",
      "focus-visible:ring-2",
    );

    fireEvent.click(presentButton);
    expect(onPresent).toHaveBeenCalledOnce();
  });

  it("keeps the unavailable action visibly disabled with its guidance", async () => {
    render(
      <BoardEditor
        draft={{ ...draft, id: undefined }}
        onChange={vi.fn()}
        isMeaningful={false}
      />,
    );

    const presentButton = screen.getByTestId("button-present-disabled");
    expect(presentButton).toHaveAccessibleName(
      "Present Screen unavailable: Add a task before presenting.",
    );
    expect(presentButton).toHaveClass("h-10", "cursor-not-allowed", "opacity-50");

    fireEvent.focus(presentButton);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Add a task before presenting.",
      );
    });
  });
});