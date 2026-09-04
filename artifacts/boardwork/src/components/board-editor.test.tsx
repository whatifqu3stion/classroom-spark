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
  it("uses a narrow-screen-safe header and content column", () => {
    render(
      <BoardEditor
        draft={{ ...draft, id: "activity-1" }}
        onChange={vi.fn()}
        saveStatus="saved"
      />,
    );

    expect(screen.getByTestId("board-editor")).toHaveClass("min-w-0");
    expect(screen.getByTestId("board-editor")).not.toHaveClass(
      "rounded-xl",
      "border",
      "shadow-sm",
    );
    expect(screen.getByTestId("board-editor-header")).toHaveClass(
      "flex-col",
      "sm:flex-row",
    );
    expect(screen.getByTestId("text-save-status")).toHaveTextContent("Saved");
    expect(screen.getByTestId("button-present")).toHaveClass(
      "w-full",
      "sm:w-auto",
    );
    expect(
      screen.getByRole("textbox", { name: "Enter a short title..." }),
    ).toBeVisible();
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
    expect(editor).toHaveAttribute("data-state", "closed");
    expect(editor).toHaveAttribute("aria-hidden", "true");
    expect(editor.children).toHaveLength(1);
    expect(editor.firstElementChild).toHaveClass("space-y-6");
    expect(screen.queryByText("No image")).not.toBeInTheDocument();
    expect(screen.queryByText("Image added")).not.toBeInTheDocument();
    expect(toggle).toHaveAccessibleName("Open presentation settings");
    expect(toggle).toHaveTextContent("Presentation settings");
    expect(screen.getByText("Visual presentation colors")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(editor).toHaveAttribute("data-state", "open");
    expect(editor).toHaveAttribute("aria-hidden", "false");
    expect(editor.children).toHaveLength(1);
    expect(screen.getByText("Add image")).toBeInTheDocument();
    expect(screen.getByTestId("presentation-theme-picker")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-preview-surface")).not.toBeInTheDocument();
    expect(toggle).toHaveAccessibleName("Close presentation settings");
    expect(screen.queryByRole("button", { name: "Teacher controls" })).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Arrival instructions (optional footer)..."),
    ).not.toBeInTheDocument();
  });

  it("presents visual settings as a secondary button with complete guidance", async () => {
    render(<BoardEditor draft={draft} onChange={vi.fn()} />);

    const toggle = screen.getByTestId("button-toggle-presentation-visual");

    expect(toggle).toHaveClass("border-border/70", "shadow-xs");

    fireEvent.focus(screen.getByRole("button", { name: "About presentation settings" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "add a local image, choose presentation colors, and add a teacher note",
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

    const titleEditor = screen.getByRole("textbox", {
      name: "Enter a short title...",
    });
    titleEditor.textContent = "Unsaved board title";
    fireEvent.input(titleEditor);

    expect(titleEditor).toHaveTextContent("Unsaved board title");

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
      "Present Screen unavailable: Add a title or task before presenting.",
    );
    expect(presentButton).toHaveClass("h-10", "cursor-not-allowed", "opacity-50");

    fireEvent.focus(presentButton);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Add a title or task before presenting.",
      );
    });
  });
});