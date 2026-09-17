import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { validateBoardContentFormatting } from "@workspace/api-zod";
import type { ActivityDraft } from "@/store/boardwork-context";
import { BoardEditor } from "./board-editor";

vi.mock("@/components/inline-editor", () => ({
  InlineEditor: ({ value, onChange, "aria-label": label }: any) => (
    <div>
      <textarea aria-label={label} value={value} readOnly />
      <button onClick={() => onChange(value, [{ text: value, bold: true }])}>Format {label}</button>
    </div>
  ),
}));

const draft: ActivityDraft = {
  classId: "test-class", title: "", task: "Read the evidence.",
  prompts: ["Compare examples.", "Explain why."], durationMinutes: 5, deviceMode: "off",
};

describe("board formatting persistence payloads", () => {
  it("fills legacy prompt formatting before editing a later prompt", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Format Prompt 2" }));
    const update = onChange.mock.calls[0][0];
    expect(update.contentFormatting.prompts).toEqual([
      [{ text: "Compare examples." }], [{ text: "Explain why.", bold: true }],
    ]);
    expect(() => validateBoardContentFormatting(update.contentFormatting, draft.task, update.prompts)).not.toThrow();
  });

  it("adds a new prompt without losing unformatted earlier prompts", () => {
    const onChange = vi.fn();
    render(<BoardEditor draft={draft} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /add prompt/i }));
    const update = onChange.mock.calls[0][0];
    expect(update.contentFormatting.prompts).toEqual([
      [{ text: "Compare examples." }], [{ text: "Explain why." }], [],
    ]);
    expect(() => validateBoardContentFormatting(update.contentFormatting, draft.task, update.prompts)).not.toThrow();
  });

  it("removes the matching prompt marks and leaves task formatting intact", () => {
    const onChange = vi.fn();
    const formatted: ActivityDraft = {
      ...draft, contentFormatting: {
        version: 1, task: [{ text: draft.task, highlight: true }],
        prompts: [[{ text: draft.prompts[0], bold: true }], [{ text: draft.prompts[1], underline: true }]],
      },
    };
    render(<BoardEditor draft={formatted} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove prompt 1" }));
    const update = onChange.mock.calls[0][0];
    expect(update.contentFormatting.task).toEqual(formatted.contentFormatting?.task);
    expect(update.contentFormatting.prompts).toEqual([[{ text: "Explain why.", underline: true }]]);
    expect(() => validateBoardContentFormatting(update.contentFormatting, draft.task, update.prompts)).not.toThrow();
  });

  it("preserves the editor on first save but resets it when another saved board opens", () => {
    const { rerender } = render(<BoardEditor draft={draft} onChange={vi.fn()} />);
    const initial = screen.getByRole("textbox", { name: "Describe the main task for students..." });
    rerender(<BoardEditor draft={{ ...draft, id: "first-board" }} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Describe the main task for students..." })).toBe(initial);
    rerender(<BoardEditor draft={{ ...draft, id: "another-board" }} onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Describe the main task for students..." })).not.toBe(initial);
  });
});