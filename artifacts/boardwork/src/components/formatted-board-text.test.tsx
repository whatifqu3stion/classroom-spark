import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormattedBoardText } from "./formatted-board-text";
import { PresentationCanvas } from "./presentation-canvas";
import type { ActivityDraft } from "@/store/boardwork-context";
import { getInlineHighlightStyle } from "@/lib/inline-formatting";

describe("FormattedBoardText", () => {
  it("combines semantic marks and preserves full underlying text", () => {
    const { container } = render(<FormattedBoardText runs={[
      { text: "Compare " }, { text: "evidence", bold: true, underline: true, highlight: true },
      { text: "\nand explain." },
    ]}>{"Compare evidence\nand explain."}</FormattedBoardText>);
    expect(container.textContent).toBe("Compare evidence\nand explain.");
    expect(container.querySelector("mark u strong")).toHaveTextContent("evidence");
    expect(container.querySelector("mark")).toHaveClass("boardwork-inline-highlight");
    expect(container.firstElementChild).toHaveAttribute("dir", "auto");
  });

  it("does not split formula rendering at a formatting boundary", () => {
    const text = "Solve \\(\\frac{1}{2}x^2\\) now";
    const { container } = render(<FormattedBoardText runs={[
      { text: "Solve \\(\\frac{1}{" }, { text: "2", bold: true, highlight: true }, { text: "}x^2\\) now" },
    ]}>{text}</FormattedBoardText>);
    expect(container.querySelectorAll("[data-formula]")).toHaveLength(1);
    expect(container.querySelector("mark strong .formula-fraction")).toBeInTheDocument();
    expect(container.textContent).not.toContain("\\frac");
  });

  it("renders HTML-like content as text and falls back safely for stale formatting", () => {
    const { container, rerender } = render(<FormattedBoardText runs={[
      { text: "<script>alert(1)</script>", bold: true },
    ]}>{"<script>alert(1)</script>"}</FormattedBoardText>);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toBe("<script>alert(1)</script>");
    rerender(<FormattedBoardText runs={[{ text: "stale", highlight: true }]}>Current task</FormattedBoardText>);
    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("Current task");
  });

  it("preserves punctuation, Unicode and malformed notation in marked text", () => {
    const text = "שלום 😀 $unfinished";
    const { container } = render(<FormattedBoardText runs={[{ text, underline: true }]}>{text}</FormattedBoardText>);
    expect(container.textContent).toBe(text);
    expect(container.querySelector(".formula-rendered")).toBeNull();
  });
});

describe("formatted presentation and export", () => {
  const activity: ActivityDraft = {
    id: "format-board", classId: "format-class", title: "", task: "Compare evidence",
    prompts: ["Explain why"], durationMinutes: 5, deviceMode: "off",
    presentationTheme: { kind: "curated", themeId: "paper-v2", accentId: "blue" },
    contentFormatting: {
      version: 1, task: [{ text: "Compare " }, { text: "evidence", highlight: true }],
      prompts: [[{ text: "Explain ", underline: true }, { text: "why", bold: true }]],
    },
  };
  it("shares marks and live accent resolution between Present and PNG surfaces", () => {
    const { container, rerender } = render(<PresentationCanvas activity={activity} />);
    expect(container.querySelector(".presentation-task mark")).toHaveTextContent("evidence");
    expect(container.querySelector(".presentation-prompt u")).toHaveTextContent("Explain");
    expect(container.querySelector(".presentation-prompt strong")).toHaveTextContent("why");
    const next = { ...activity, presentationTheme: { kind: "curated" as const, themeId: "midnight", accentId: "sage" } };
    rerender(<PresentationCanvas activity={next} exportLayout />);
    const surface = container.querySelector(".presentation-surface--export") as HTMLElement;
    expect(surface).toBeInTheDocument();
    expect(surface.style.getPropertyValue("--inline-highlight-background")).toBe(
      (getInlineHighlightStyle(next.presentationTheme) as Record<string, string>)["--inline-highlight-background"],
    );
    expect(surface.querySelector("mark")).toHaveTextContent("evidence");
    expect(surface.querySelector("strong")).toHaveTextContent("why");
  });
});