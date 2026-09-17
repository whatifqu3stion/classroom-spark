import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEditor } from './inline-editor';
import { createHtmlFromRuns, getTextFromDoc, getRunsFromDoc } from './helpers';
import { vi, describe, it, expect, beforeAll } from 'vitest';
import { Editor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import HardBreak from '@tiptap/extension-hard-break';

beforeAll(() => {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => ({}) as DOMRect;
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Element.prototype.getBoundingClientRect = () => ({}) as DOMRect;
});

describe('InlineEditor', () => {
  it('renders correctly', () => {
    const onChange = vi.fn();
    render(<InlineEditor value="Hello" onChange={onChange} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps repeated spaces, line breaks and the selected accent without saving on load', () => {
    const onChange = vi.fn();
    const { container } = render(<InlineEditor
      value={"Read  carefully\nThen explain."}
      runs={[{ text: "stale", bold: true }]}
      onChange={onChange}
      presentationTheme={{ kind: "curated", themeId: "midnight", accentId: "sage" }}
    />);
    expect(screen.getByRole("textbox").textContent).toBe("Read  carefullyThen explain.");
    expect(screen.getByRole("textbox").querySelector("br")).toBeInTheDocument();
    expect(screen.getByRole("textbox").querySelector("strong")).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--inline-highlight-background")).toMatch(/^#/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updates text on input', async () => {
    const onChange = vi.fn();
    render(<InlineEditor value="Initial" onChange={onChange} />);
    
    const editorEl = screen.getByRole('textbox');
    await act(async () => {
      editorEl.focus();
      await userEvent.keyboard(' text');
    });
    
    expect(onChange).toHaveBeenCalled();
  });

  describe('helpers', () => {
    it('creates html from runs', () => {
      const html = createHtmlFromRuns('Hello\nWorld', [
        { text: 'Hello', bold: true },
        { text: '\n' },
        { text: 'World' }
      ]);
      expect(html).toBe('<p><strong>Hello</strong><br>World</p>');
    });

    it('extracts runs from doc', () => {
      const editor = new Editor({
        extensions: [Document, Paragraph, Text, Bold, HardBreak],
        content: '<p><strong>Hello</strong><br>World</p>'
      });
      const runs = getRunsFromDoc(editor.state.doc);
      expect(runs).toEqual([
        { text: 'Hello', bold: true, underline: undefined, highlight: undefined },
        { text: '\nWorld', bold: undefined, underline: undefined, highlight: undefined }
      ]);
    });
  });
});