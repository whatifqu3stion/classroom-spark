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
  resolve: (value: string) => void;
  reject: () => void;
  aborted: () => boolean;
};

function useDeferredFileReader() {
  const readers: DeferredReader[] = [];

  class TestFileReader {
    static LOADING = 1;
    result: string | null = null;
    readyState = TestFileReader.LOADING;
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
    wasAborted = false;

    readAsDataURL() {
      readers.push({
        resolve: (value) => {
          this.result = value;
          this.readyState = 2;
          this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
        },
        reject: () => {
          this.readyState = 2;
          this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
        },
        aborted: () => this.wasAborted,
      });
    }

    abort() {
      this.wasAborted = true;
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

function expectNoRetiredControls() {
  expect(screen.queryByTestId(/image-selector/)).not.toBeInTheDocument();
  expect(screen.queryByText("Added", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText("Empty", { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText(/Replace image/)).not.toBeInTheDocument();
}

describe("PresentationImageEditor simultaneous previews", () => {
  it("shows a compact empty state and one append-only Add image input", () => {
    render(<PresentationImageEditor draft={draft} onChange={vi.fn()} />);

    expect(screen.getByTestId("image-workspace")).toBeInTheDocument();
    expect(screen.queryAllByTestId("visual-preview")).toHaveLength(0);
    expect(screen.getByLabelText("Add image")).toBeEnabled();
    expect(screen.getAllByLabelText("Add image")).toHaveLength(1);
    expect(screen.queryByRole("textbox", { name: /Visual description/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove image/ })).not.toBeInTheDocument();
    expectNoRetiredControls();
  });

  it("renders one image with its caption and keeps Add image available", () => {
    render(
      <PresentationImageEditor
        draft={withVisuals([{ url: firstUrl, description: "First visual" }])}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("visual-preview")).toHaveAccessibleName("Image 1 preview");
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue("First visual");
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeEnabled();
    expect(screen.getByLabelText("Add image")).toBeEnabled();
    expectNoRetiredControls();
  });

  it("renders both images and independently editable descriptions, then hides Add image", () => {
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

    const previews = screen.getAllByTestId("visual-preview");
    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveAccessibleName("Image 1 preview");
    expect(previews[1]).toHaveAccessibleName("Image 2 preview");
    expect(screen.queryByLabelText("Add image")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Visual description 2" }), {
      target: { value: "Updated second visual" },
    });
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue("First visual");
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [
        { url: firstUrl, description: "First visual" },
        { url: secondUrl, description: "Updated second visual" },
      ],
      visualUrl: firstUrl,
      visualDescription: "First visual",
    });
    expectNoRetiredControls();
  });

  it("appends uploads and focuses the new description when the second upload hides Add image", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "Keep first" }])}
        onChange={onChange}
      />,
    );

    const add = screen.getByLabelText("Add image");
    upload(add, "second.png");
    expect(add).toBeDisabled();
    act(() => readers[0].resolve(secondUrl));

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Visual description 2" })).toHaveFocus(),
    );
    expect(screen.queryByLabelText("Add image")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("visual-preview").map((image) => image.getAttribute("src"))).toEqual([
      firstUrl,
      secondUrl,
    ]);
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [
        { url: firstUrl, description: "Keep first" },
        { url: secondUrl, description: null },
      ],
      visualUrl: firstUrl,
      visualDescription: "Keep first",
    });
  });
});

describe("PresentationImageEditor asynchronous reads", () => {
  it("keeps descriptions editable while blocking duplicate adds and removals", () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "Original" }])}
        onChange={onChange}
      />,
    );

    const add = screen.getByLabelText("Add image");
    upload(add, "second.png");
    expect(add).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove image 1" })).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Visual description 1" }), {
      target: { value: "Edited while reading" },
    });
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue(
      "Edited while reading",
    );

    upload(add, "duplicate.png");
    fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
    expect(readers).toHaveLength(1);
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [{ url: firstUrl, description: "Edited while reading" }],
      visualUrl: firstUrl,
      visualDescription: "Edited while reading",
    });
  });

  it("commits a pending append with the latest caption and survives first id assignment", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    const initial = withVisuals([{ url: firstUrl, description: "Original" }]);
    const { rerender } = render(<PresentationImageEditor draft={initial} onChange={onChange} />);

    upload(screen.getByLabelText("Add image"));
    rerender(
      <PresentationImageEditor
        draft={withVisuals([{ url: firstUrl, description: "Latest" }], "assigned-id")}
        onChange={onChange}
      />,
    );
    act(() => readers[0].resolve(secondUrl));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [
        { url: firstUrl, description: "Latest" },
        { url: secondUrl, description: null },
      ],
      visualUrl: firstUrl,
      visualDescription: "Latest",
    });
  });

  it("does not alter an existing image after cancel, oversized, invalid, or unreadable files", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "Keep this" }])}
        onChange={onChange}
      />,
    );

    const add = screen.getByLabelText("Add image");
    fireEvent.change(add, { target: { files: [] } });
    expect(onChange).not.toHaveBeenCalled();

    const oversized = new File(
      [new Uint8Array(PRESENTATION_IMAGE_FILE_LIMIT_BYTES + 1)],
      "too-large.png",
      { type: "image/png" },
    );
    fireEvent.change(add, { target: { files: [oversized] } });
    expect(screen.getByTestId("visual-upload-error")).toHaveTextContent(PRESENTATION_IMAGE_SIZE_ERROR);
    expect(onChange).not.toHaveBeenCalled();

    upload(add, "invalid.png");
    act(() => readers[0].resolve("data:image/png;base64,not valid"));
    await waitFor(() => expect(screen.getByTestId("visual-upload-error")).toBeInTheDocument());
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).not.toHaveBeenCalled();

    upload(screen.getByLabelText("Add image"), "unreadable.png");
    act(() => readers[1].reject());
    await waitFor(() =>
      expect(screen.getByTestId("visual-upload-error")).toHaveTextContent("could not be read"),
    );
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", firstUrl);
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "board",
      nextDraft: withVisuals([], "board-2"),
    },
    {
      name: "class",
      nextDraft: { ...withVisuals([], "board-1"), classId: "class-2" },
    },
  ])("aborts a stale read after a $name change", ({ nextDraft }) => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    const { rerender } = render(
      <PresentationImageEditor
        draft={withVisuals([{ url: firstUrl, description: "First" }], "board-1")}
        onChange={onChange}
      />,
    );

    upload(screen.getByLabelText("Add image"));
    rerender(
      <PresentationImageEditor
        draft={nextDraft}
        onChange={onChange}
      />,
    );
    expect(readers[0].aborted()).toBe(true);
    act(() => readers[0].resolve(secondUrl));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("aborts a pending read on unmount", () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    const { unmount } = render(
      <PresentationImageEditor draft={withVisuals([])} onChange={onChange} />,
    );

    upload(screen.getByLabelText("Add image"));
    unmount();
    expect(readers[0].aborted()).toBe(true);
    act(() => readers[0].resolve(secondUrl));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PresentationImageEditor removal", () => {
  it.each([
    {
      name: "first",
      remove: "Remove image 1",
      remainingUrl: secondUrl,
      remainingDescription: "Second",
    },
    {
      name: "second",
      remove: "Remove image 2",
      remainingUrl: firstUrl,
      remainingDescription: "First",
    },
  ])("removes the $name image only and focuses the restored Add image input", async ({
    remove,
    remainingUrl,
    remainingDescription,
  }) => {
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

    fireEvent.click(screen.getByRole("button", { name: remove }));
    await waitFor(() => expect(screen.getByLabelText("Add image")).toHaveFocus());
    expect(screen.getAllByTestId("visual-preview")).toHaveLength(1);
    expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", remainingUrl);
    expect(screen.getByRole("textbox", { name: "Visual description 1" })).toHaveValue(
      remainingDescription,
    );
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [{ url: remainingUrl, description: remainingDescription }],
      visualUrl: remainingUrl,
      visualDescription: remainingDescription,
    });
  });

  it("removes the last image, focuses Add image, and allows another append", async () => {
    const readers = useDeferredFileReader();
    const onChange = vi.fn();
    render(
      <ControlledEditor
        initialDraft={withVisuals([{ url: firstUrl, description: "First" }])}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove image 1" }));
    const add = await screen.findByLabelText("Add image");
    await waitFor(() => expect(add).toHaveFocus());
    expect(screen.queryByTestId("visual-preview")).not.toBeInTheDocument();

    upload(add, "new.png");
    act(() => readers[0].resolve(secondUrl));
    await waitFor(() => expect(screen.getByTestId("visual-preview")).toHaveAttribute("src", secondUrl));
    expect(onChange).toHaveBeenLastCalledWith({
      visuals: [{ url: secondUrl, description: null }],
      visualUrl: secondUrl,
      visualDescription: null,
    });
  });
});