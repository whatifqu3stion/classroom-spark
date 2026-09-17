import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ActivityDraft, PresentationVisual } from "@/store/boardwork-context";
import {
  PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
  PRESENTATION_IMAGE_SIZE_ERROR,
} from "@workspace/api-zod";
import { PresentationImageEditor } from "./presentation-image-editor";

const firstUrl = "data:image/png;base64,Zmlyc3Q=";
const secondUrl = "data:image/png;base64,c2Vjb25k";
const replacementUrl = "data:image/png;base64,cmVwbGFjZWQ=";

const draft: ActivityDraft = {
  classId: "class-1",
  title: "Independent practice",
  task: "Work quietly.",
  prompts: [],
  durationMinutes: 5,
  deviceMode: "off",
};

function withVisuals(visuals: PresentationVisual[], id?: string): ActivityDraft {
  return {
    ...draft,
    id,
    visuals,
    visualUrl: visuals[0]?.url ?? null,
    visualDescription: visuals[0]?.description ?? null,
  };
}

type DeferredReader = {
  result: string | null;
  resolve: (value: string) => void;
  reject: () => void;
};

function useDeferredFileReader() {
  const readers: DeferredReader[] = [];

  class TestFileReader {
    static LOADING = 1;
    result: string | null = null;
    readyState = TestFileReader.LOADING;
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

    readAsDataURL() {
      readers.push({
        result: this.result,
        resolve: (value) => {
          this.result = value;
          this.readyState = 2;
          this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
        },
        reject: () => {
          this.readyState = 2;
          this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
        },
      });
    }

    abort() {
      this.readyState = 2;
    }
  }

  vi.stubGlobal("FileReader", TestFileReader);
  return readers;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function ControlledEditor({
  initialDraft,
  onChange,
}: {
  initialDraft: ActivityDraft;
  onChange?: (updates: Partial<ActivityDraft>) => void;
}) {
  const [currentDraft, setCurrentDraft] = useState(initialDraft);

  return (
    <PresentationImageEditor
      draft={currentDraft}
      onChange={(updates) => {
        onChange?.(updates);
        setCurrentDraft((previous) => ({ ...previous, ...updates }));
      }}
    />
  );
}

function upload(fileInput: HTMLElement, name = "image.png") {
  fireEvent.change(fileInput, {
    target: { files: [new File(["image"], name, { type: "image/png" })] },
  });
}

describe("PresentationImageEditor empty and compatibility controls", () => {
  it("keeps both selectors and empty controls persistent", () => {
    render(<PresentationImageEditor draft={draft} onChange={vi.fn()} />);

    const first = screen.getByTestId("image-selector-1");
    const second = screen.getByTestId("image-selector-2");
    expect(first).toHaveAccessibleName("Image 1, Empty");
    expect(second).toHaveAccessibleName("Image 2, Empty");
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-disabled", "true");
    expect(second).not.toBeDisabled();
    expect(second).toHaveProperty("tabIndex", 0);
    expect(screen.getByTestId("image-workspace")).toBeInTheDocument();
    expect(screen.queryByTestId("visual-preview")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toBeDisabled();
    expect(screen.getByLabelText("Add image 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeDisabled();
  });

  it("emits visuals and the first-image compatibility fields after a successful read", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(<ControlledEditor initialDraft={draft} onChange={onChange} />);

    upload(screen.getByLabelText("Add image 1"));
    expect(screen.getByLabelText("Add image 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeDisabled();
    act(() => readers[0].resolve(firstUrl));

    await waitFor(() => {
      expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    });
    expect(screen.getByRole("button", { name: "Image 1, Added" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Image 2, Empty" })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByLabelText("Replace image 1")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeEnabled();
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [{ url: firstUrl, description: null }],
      visualUrl: firstUrl,
      visualDescription: null,
    });
  });

  it("switches slots without emitting changes and uses one shared workspace", () => {
    const onChange = vi.fn();
    render(
      <PresentationImageEditor
        draft={withVisuals([
          { url: firstUrl, description: "First visual" },
          { url: secondUrl, description: "Second visual" },
        ])}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue(
      "First visual",
    );
    fireEvent.click(screen.getByRole("button", { name: "Image 2, Added" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Image 2, Added" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", secondUrl);
    expect(screen.getByRole("textbox", { name: "Visual description 2" })).toHaveValue(
      "Second visual",
    );
    expect(screen.getByLabelText("Replace image 2")).toBeInTheDocument();
    expect(screen.getByTestId("image-workspace")).toBeInTheDocument();
  });

  it("keeps description changes compatible with the first-image fields", () => {
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([
          { url: firstUrl, description: "First visual" },
          { url: secondUrl, description: "Second visual" },
        ])}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Image 2, Added" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Visual description 2" }), {
      target: { value: "Updated second visual" },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [
        { url: firstUrl, description: "First visual" },
        { url: secondUrl, description: "Updated second visual" },
      ],
      visualUrl: firstUrl,
      visualDescription: "First visual",
    });
  });
});

describe("PresentationImageEditor asynchronous image reads", () => {
  it("applies a deferred read to its captured slot using the latest images and descriptions", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "Original first" }])}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Image 2, Empty" }));
    upload(screen.getByLabelText("Add image 2"), "second.png");
    fireEvent.click(screen.getByRole("button", { name: "Image 1, Added" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Visual description 1" }), {
      target: { value: "Latest first description" },
    });

    act(() => readers[0].resolve(secondUrl));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Image 2, Added" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    expect(screen.getByRole("textbox", { name: "Visual description 2" })).toHaveValue("");
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [
        { url: firstUrl, description: "Latest first description" },
        { url: secondUrl, description: null },
      ],
      visualUrl: firstUrl,
      visualDescription: "Latest first description",
    });
  });

  it("leaves navigation and descriptions usable while disabling file actions during a read", () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([
          { url: firstUrl, description: "First" },
          { url: secondUrl, description: "Second" },
        ])}
        onChange={onChange}
      />,
    );

    upload(screen.getByLabelText("Replace image 1"));
    expect(screen.getByLabelText("Replace image 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Image 2, Added" }));
    expect(screen.getByRole("textbox", { name: "Visual description 2" })).toBeEnabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Visual description 2" }), {
      target: { value: "Edited while reading" },
    });
    expect(onChange).toHaveBeenCalled();
    expect(readers).toHaveLength(1);
  });

  it("does not destroy the existing image for oversized, invalid, or unreadable files", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "Keep this" }])}
        onChange={onChange}
      />,
    );

    const oversized = new File(
      [new Uint8Array(PRESENTATION_IMAGE_FILE_LIMIT_BYTES + 1)],
      "too-large.png",
      { type: "image/png" },
    );
    fireEvent.change(screen.getByLabelText("Replace image 1"), {
      target: { files: [oversized] },
    });
    expect(screen.getByTestId("visual-upload-error")).toHaveTextContent(
      PRESENTATION_IMAGE_SIZE_ERROR,
    );
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).not.toHaveBeenCalled();

    upload(screen.getByLabelText("Replace image 1"), "invalid.png");
    act(() => readers[0].resolve("data:image/png;base64,not valid"));
    await waitFor(() => expect(screen.getByTestId("visual-upload-error")).toBeInTheDocument());
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).not.toHaveBeenCalled();

    upload(screen.getByLabelText("Replace image 1"), "unreadable.png");
    act(() => readers[1].reject());
    await waitFor(() =>
      expect(screen.getByTestId("visual-upload-error")).toHaveTextContent(
        "could not be read",
      ),
    );
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PresentationImageEditor lifecycle and removal", () => {
  it("cancels a stale read and resets the active slot when the parent changes boards", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    const { rerender } = render(
      <PresentationImageEditor
        draft={withVisuals(
          [
            { url: firstUrl, description: "First" },
            { url: secondUrl, description: "Second" },
          ],
          "board-1",
        )}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Image 2, Added" }));
    upload(screen.getByLabelText("Replace image 2"));
    rerender(
      <PresentationImageEditor
        draft={withVisuals([{ url: firstUrl, description: "New board" }], "board-2")}
        onChange={onChange}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Image 1, Added" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    act(() => readers[0].resolve(replacementUrl));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves the selected slot when an unsaved board receives its first id", async () => {
    const { rerender } = render(
      <PresentationImageEditor
        draft={withVisuals([
          { url: firstUrl, description: "First" },
          { url: secondUrl, description: "Second" },
        ])}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Image 2, Added" }));
    rerender(
      <PresentationImageEditor
        draft={withVisuals(
          [
            { url: firstUrl, description: "First" },
            { url: secondUrl, description: "Second" },
          ],
          "new-board-id",
        )}
        onChange={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Image 2, Added" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  });

  it("shifts the surviving image and description to Image 1, then focuses its selector", async () => {
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([
          { url: firstUrl, description: "First" },
          { url: secondUrl, description: "Surviving second" },
        ])}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Image 1, Added" })).toHaveFocus();
    });
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", secondUrl);
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue(
      "Surviving second",
    );
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [{ url: secondUrl, description: "Surviving second" }],
      visualUrl: secondUrl,
      visualDescription: "Surviving second",
    });
  });
});