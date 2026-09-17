import { Fragment, type ReactNode } from "react";
import type { InlineTextRun } from "@workspace/api-zod";
import { getInlineHighlightStyle, normalizeFormulaRuns } from "@/lib/inline-formatting";
import type { BoardworkPresentationTheme } from "@/lib/presentation-theme";
import { FormulaSegmentView, FormulaText, hasFormulaNotation, parseFormulaText } from "./formula-text";

function withMarks(content: ReactNode, run: InlineTextRun) {
  let result = content;
  if (run.bold) result = <strong className="boardwork-inline-bold">{result}</strong>;
  if (run.underline) result = <u className="boardwork-inline-underline">{result}</u>;
  if (run.highlight) result = <mark className="boardwork-inline-highlight">{result}</mark>;
  return result;
}

/** Parse formulas before splitting prose into runs, so marks cannot change notation detection. */
export function FormattedBoardText({ children, runs }: { children: string; runs?: InlineTextRun[] | null }) {
  const normalized = normalizeFormulaRuns(children, runs);
  if (!normalized.some((run) => run.bold || run.underline || run.highlight)) {
    return <FormulaText>{children}</FormulaText>;
  }
  let position = 0;
  const ranges = normalized.map((run) => {
    const from = position;
    position += run.text.length;
    return { ...run, from, to: position };
  });
  let cursor = 0;
  position = 0;
  const content: ReactNode[] = [];
  for (const segment of parseFormulaText(children)) {
    const source = segment.kind === "text" ? segment.value : segment.source;
    const end = position + source.length;
    while (cursor < ranges.length && ranges[cursor].to <= position) cursor++;
    if (segment.kind === "formula") {
      content.push(withMarks(<FormulaSegmentView segment={segment} />, ranges[cursor]));
    } else {
      for (let index = cursor; index < ranges.length && ranges[index].from < end; index++) {
        const run = ranges[index];
        const part = source.slice(Math.max(position, run.from) - position, Math.min(end, run.to) - position);
        content.push(withMarks(part, run));
      }
    }
    position = end;
  }
  return (
    <span className="formula-text boardwork-user-content" dir="auto">
      {content.map((node, index) => <Fragment key={index}>{node}</Fragment>)}
    </span>
  );
}

export function FormattedFormulaPreview({ children, runs, theme }: {
  children: string;
  runs?: InlineTextRun[];
  theme?: BoardworkPresentationTheme | null;
}) {
  if (!hasFormulaNotation(children)) return null;
  return (
    <div className="formula-editor-preview" aria-label="Rendered formula preview" style={getInlineHighlightStyle(theme)}>
      <span className="formula-editor-preview-label">Formula preview</span>
      <FormattedBoardText runs={runs}>{children}</FormattedBoardText>
    </div>
  );
}