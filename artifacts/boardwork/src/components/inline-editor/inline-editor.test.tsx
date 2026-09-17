import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { useState } from 'react';
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
import type { InlineTextRun } from '@workspace/api-zod';

beforeAll(() => {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => ({}) as DOMRect;
  Element.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Element.prototype.getBoundingClientRect = () => ({}) as DOMRect;
});

describe('InlineEditor', () => {
  it('applies combined marks through portaled toolbar clicks and supports clear/undo', async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [content, setContent] = useState<{ value: string; runs?: InlineTextRun[] }>({ value: 'Compare two diagrams.' });
      return <InlineEditor {...content} onChange={(value, runs) => {
        onChange(value, runs);
        setContent({ value, runs });
      }} />;
    }
    const { container } = render(<Controlled />);
    const textbox = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    const editor = textbox.editor;
    await act(async () => {
      editor.commands.focus();
      editor.commands.setTextSelection({ from: 1, to: 8 });
    });
    const toolbar = await screen.findByRole('toolbar', { name: 'Text formatting' });
    expect(container).not.toContainElement(toolbar);
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    await userEvent.click(screen.getByRole('button', { name: 'Underline' }));
    await userEvent.click(screen.getByRole('button', { name: 'Highlight' }));
    expect(textbox.querySelector('strong')).toHaveTextContent('Compare');
    expect(textbox.querySelector('u')).toHaveTextContent('Compare');
    expect(textbox.querySelector('mark')).toHaveTextContent('Compare');
    expect(onChange).toHaveBeenLastCalledWith('Compare two diagrams.', [
      { text: 'Compare', bold: true, underline: true, highlight: true },
      { text: ' two diagrams.' },
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Clear formatting' }));
    expect(textbox.querySelector('strong, u, mark')).toBeNull();
    await act(async () => { editor.commands.undo(); });
    expect(textbox.querySelector('mark')).toHaveTextContent('Compare');
    await act(async () => { editor.commands.redo(); });
    expect(textbox.querySelector('strong, u, mark')).toBeNull();
    await act(async () => { editor.commands.setTextSelection(8); });
    await waitFor(() => expect(screen.queryByRole('toolbar')).not.toBeInTheDocument());
  });

  it('expands partial formula selections for applying and clearing marks', async () => {
    const onChange = vi.fn();
    render(<InlineEditor value={'Read $x^2$ now.'} onChange={onChange} />);
    const textbox = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    await act(async () => {
      textbox.editor.commands.focus();
      textbox.editor.commands.setTextSelection({ from: 7, to: 8 });
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Bold' }));
    expect(textbox.querySelector('strong')).toHaveTextContent('$x^2$');
    expect(textbox.editor.state.selection.to - textbox.editor.state.selection.from).toBe(5);
    await userEvent.click(screen.getByRole('button', { name: 'Clear formatting' }));
    expect(textbox.querySelector('strong')).toBeNull();
  });

  it('pastes plaintext with authored line breaks instead of importing HTML', async () => {
    const onChange = vi.fn();
    render(<InlineEditor value="Replace me" multiline onChange={onChange} />);
    const textbox = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    await act(async () => {
      textbox.editor.commands.focus();
      textbox.editor.commands.selectAll();
    });
    fireEvent.paste(textbox, {
      clipboardData: { getData: (format: string) => format === 'text/plain' ? '  اقرأ 👩🏽‍🔬\n日本語  ' : '<b>not imported</b>' },
    });
    expect(onChange.mock.lastCall?.[0]).toBe('  اقرأ 👩🏽‍🔬\n日本語  ');
    expect(textbox.querySelector('strong')).toBeNull();
    expect(textbox.querySelectorAll('br')).toHaveLength(1);
  });

  it('dismisses on Escape and reopens immediately for a different selection', async () => {
    render(<InlineEditor value="First second" onChange={vi.fn()} />);
    const textbox = screen.getByRole('textbox') as HTMLElement & { editor: Editor };
    await act(async () => {
      textbox.editor.commands.focus();
      textbox.editor.commands.setTextSelection({ from: 1, to: 6 });
    });
    expect(await screen.findByRole('toolbar')).toBeVisible();
    fireEvent.keyDown(textbox, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('toolbar')).not.toBeInTheDocument());
    await act(async () => {
      textbox.editor.commands.setTextSelection({ from: 7, to: 13 });
    });
    expect(await screen.findByRole('toolbar')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(textbox.querySelector('strong')).toHaveTextContent('second');
  });

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