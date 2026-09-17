import type { InlineTextRun } from '@workspace/api-zod';
import { normalizeFormulaRuns } from '@/lib/inline-formatting';

function escapeHtml(str: string) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] as string));
}

export function createHtmlFromRuns(text: string, runs?: InlineTextRun[]): string {
  runs = normalizeFormulaRuns(text, runs);
  if (!runs || runs.length === 0) {
    return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
  }
  
  let html = '';
  for (const run of runs) {
    let piece = escapeHtml(run.text).replace(/\n/g, '<br>');
    if (run.bold) piece = `<strong>${piece}</strong>`;
    if (run.underline) piece = `<u>${piece}</u>`;
    if (run.highlight) piece = `<mark>${piece}</mark>`;
    html += piece;
  }
  return `<p>${html}</p>`;
}

export function getTextFromDoc(doc: any): string {
  return doc.textBetween(0, doc.content.size, '\n', '\n');
}

export function getRunsFromDoc(doc: any): InlineTextRun[] {
  const runs: InlineTextRun[] = [];
  
  doc.descendants((node: any, pos: number) => {
    if (node.isText) {
      const text = node.text || "";
      const marks = node.marks.map((m: any) => m.type.name);
      runs.push({
        text,
        bold: marks.includes("bold") || undefined,
        underline: marks.includes("underline") || undefined,
        highlight: marks.includes("highlight") || undefined,
      });
    } else if (node.type.name === 'hardBreak') {
      runs.push({ text: "\n" });
    } else if (node.isBlock && pos > 0) {
      runs.push({ text: "\n" });
    }
    return true;
  });
  
  const condensed: InlineTextRun[] = [];
  let current: any = null;
  for (const run of runs) {
    if (!current) {
      current = { ...run };
    } else if (
      current.bold === run.bold &&
      current.underline === run.underline &&
      current.highlight === run.highlight
    ) {
      current.text += run.text;
    } else {
      condensed.push(current);
      current = { ...run };
    }
  }
  if (current) condensed.push(current);
  
  return condensed;
}

export function mapPosToTextOffset(doc: any, targetPos: number): number {
  let currentOffset = 0;
  doc.descendants((node: any, pos: number) => {
    if (pos >= targetPos) return false;
    
    if (node.isText) {
      const len = node.text?.length || 0;
      if (pos + len >= targetPos) {
        currentOffset += (targetPos - pos);
        return false;
      }
      currentOffset += len;
    } else if (node.type.name === 'hardBreak') {
      if (pos === targetPos) return false;
      currentOffset += 1;
    } else if (node.isBlock && pos > 0) {
      if (pos === targetPos) return false;
      currentOffset += 1;
    }
    return true;
  });
  return currentOffset;
}

export function mapTextOffsetToPos(doc: any, targetOffset: number): number {
  let currentOffset = 0;
  let targetPos = 1;
  let found = false;
  
  doc.descendants((node: any, pos: number) => {
    if (found) return false;
    
    if (node.isText) {
      const len = node.text?.length || 0;
      if (currentOffset + len >= targetOffset) {
        targetPos = pos + (targetOffset - currentOffset);
        found = true;
        return false;
      }
      currentOffset += len;
    } else if (node.type.name === 'hardBreak') {
      if (currentOffset === targetOffset) {
        targetPos = pos;
        found = true;
        return false;
      }
      currentOffset += 1;
    } else if (node.isBlock && pos > 0) {
      if (currentOffset === targetOffset) {
        targetPos = pos;
        found = true;
        return false;
      }
      currentOffset += 1;
    }
    return true;
  });
  
  if (!found) return doc.content.size - 1;
  return targetPos;
}