import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import Bold from '@tiptap/extension-bold';
import Underline from '@tiptap/extension-underline';
import History from '@tiptap/extension-history';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, type Selection } from '@tiptap/pm/state';
import { Bold as BoldIcon, Highlighter, Underline as UnderlineIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { InlineTextRun } from '@workspace/api-zod';
import type { PresentationThemeSelection } from '@workspace/api-client-react';
import { 
  createHtmlFromRuns, 
  getTextFromDoc, 
  getRunsFromDoc,
  mapPosToTextOffset,
  mapTextOffsetToPos
} from './helpers';
import './inline-editor.css';
import { getInlineFormulaRanges, normalizeFormulaRuns, getInlineHighlightStyle } from '@/lib/inline-formatting';

export interface InlineEditorProps {
  value: string;
  runs?: InlineTextRun[];
  onChange: (value: string, runs?: InlineTextRun[]) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  presentationTheme?: PresentationThemeSelection | null;
  'aria-label'?: string;
}

function toggleExpandedMark(editor: Editor, markType: string) {
  const { from, to, empty } = editor.state.selection;
  if (empty) {
    editor.chain().focus().toggleMark(markType).run();
    return;
  }

  const doc = editor.state.doc;
  const canonicalText = getTextFromDoc(doc);
  const offsetFrom = mapPosToTextOffset(doc, from);
  const offsetTo = mapPosToTextOffset(doc, to);

  const ranges = getInlineFormulaRanges(canonicalText) || [];
  let newOffsetFrom = offsetFrom;
  let newOffsetTo = offsetTo;

  for (const r of ranges) {
    if (Math.max(offsetFrom, r.from) < Math.min(offsetTo, r.to)) {
      newOffsetFrom = Math.min(newOffsetFrom, r.from);
      newOffsetTo = Math.max(newOffsetTo, r.to);
    }
  }

  const newFrom = mapTextOffsetToPos(doc, newOffsetFrom);
  const newTo = mapTextOffsetToPos(doc, newOffsetTo);

  editor.chain().focus().setTextSelection({ from: newFrom, to: newTo }).toggleMark(markType).run();
}

const CustomBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return ['strong', { ...HTMLAttributes, class: 'boardwork-inline-bold' }, 0];
  },
  addKeyboardShortcuts() {
    return {
      'Mod-b': () => { toggleExpandedMark(this.editor, this.name); return true; },
      'Mod-B': () => { toggleExpandedMark(this.editor, this.name); return true; },
    };
  }
});

const CustomUnderline = Underline.extend({
  renderHTML({ HTMLAttributes }) {
    return ['u', { ...HTMLAttributes, class: 'boardwork-inline-underline' }, 0];
  },
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => { toggleExpandedMark(this.editor, this.name); return true; },
      'Mod-U': () => { toggleExpandedMark(this.editor, this.name); return true; },
    };
  }
});

const CustomHighlight = Highlight.extend({
  renderHTML({ HTMLAttributes }) {
    return ['mark', { ...HTMLAttributes, class: 'boardwork-inline-highlight' }, 0];
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => { toggleExpandedMark(this.editor, this.name); return true; },
      'Mod-Shift-H': () => { toggleExpandedMark(this.editor, this.name); return true; },
    };
  }
});

const InlineBehavior = Extension.create<{ multiline: boolean }>({
  name: 'inlineBehavior',
  addOptions() {
    return { multiline: true };
  },
  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        if (!this.options.multiline) return true;
        this.editor.commands.setHardBreak();
        return true;
      }
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('inlineBehaviorPaste'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain') || '';
            const cleanText = this.options.multiline ? text : text.replace(/[\r\n]+/g, ' ');
            
            const tr = view.state.tr;
            if (this.options.multiline && cleanText.includes('\n')) {
              const lines = cleanText.split(/\r?\n/);
              lines.forEach((line, i) => {
                if (line) tr.insertText(line);
                if (i < lines.length - 1) {
                  const hardBreak = view.state.schema.nodes.hardBreak.create();
                  tr.replaceSelectionWith(hardBreak);
                }
              });
            } else {
              tr.insertText(cleanText);
            }
            view.dispatch(tr);
            return true;
          }
        }
      })
    ];
  }
});

export function InlineEditor({
  value,
  runs,
  onChange,
  placeholder = "",
  multiline = false,
  className,
  presentationTheme,
  'aria-label': ariaLabel,
}: InlineEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  // The plugin may attach/detach this container. React owns only its portal
  // children, so delegated click/key events continue working outside #root.
  const [menuElement] = useState(() => document.createElement("div"));
  
  const [activeMarks, setActiveMarks] = useState({ bold: false, underline: false, highlight: false });
  const [mixedMarks, setMixedMarks] = useState({ bold: false, underline: false, highlight: false });
  const dismissedSelection = useRef<Selection | null>(null);
  const menuKey = useRef(new PluginKey('boardInlineFormatting')).current;

  const updateMarks = useCallback((editor: Editor) => {
    const { from, to, empty } = editor.state.selection;
    
    if (empty) {
      setActiveMarks({
        bold: editor.isActive('bold'),
        underline: editor.isActive('underline'),
        highlight: editor.isActive('highlight'),
      });
      setMixedMarks({ bold: false, underline: false, highlight: false });
      return;
    }
    
    let hasBold = false;
    let hasUnderline = false;
    let hasHighlight = false;
    let hasNonBold = false;
    let hasNonUnderline = false;
    let hasNonHighlight = false;
    let hasText = false;
    
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        hasText = true;
        const marks = node.marks.map(m => m.type.name);
        if (marks.includes('bold')) hasBold = true; else hasNonBold = true;
        if (marks.includes('underline')) hasUnderline = true; else hasNonUnderline = true;
        if (marks.includes('highlight')) hasHighlight = true; else hasNonHighlight = true;
      }
    });
    
    if (!hasText) {
      setActiveMarks({ bold: false, underline: false, highlight: false });
      setMixedMarks({ bold: false, underline: false, highlight: false });
      return;
    }
    
    setActiveMarks({
      bold: hasBold && !hasNonBold,
      underline: hasUnderline && !hasNonUnderline,
      highlight: hasHighlight && !hasNonHighlight,
    });
    setMixedMarks({
      bold: hasBold && hasNonBold,
      underline: hasUnderline && hasNonUnderline,
      highlight: hasHighlight && hasNonHighlight,
    });
  }, []);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      History,
      CustomBold,
      CustomUnderline,
      CustomHighlight,
      InlineBehavior.configure({ multiline }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: createHtmlFromRuns(value, runs),
    parseOptions: { preserveWhitespace: "full" },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === "Escape" && !view.state.selection.empty) {
          dismissedSelection.current = view.state.selection;
          view.dispatch(view.state.tr.setMeta(menuKey, "hide"));
          return true;
        }
        if (event.key === "Tab" && !event.shiftKey && !view.state.selection.empty &&
          !dismissedSelection.current?.eq(view.state.selection) && toolbarRef.current?.isConnected) {
          toolbarRef.current.querySelector("button")?.focus();
          return true;
        }
        return false;
      },
      attributes: {
        class: cn(
          "boardwork-user-content outline-none cursor-text transition-colors hover:bg-muted/50 focus:bg-muted/30 focus:ring-2 focus:ring-ring rounded-lg px-1.5 -mx-1.5 py-0.5 -my-0.5",
          className
        ),
        'aria-label': ariaLabel || placeholder,
        'role': 'textbox',
        'aria-multiline': multiline ? 'true' : 'false',
        'dir': 'auto',
      },
    },
    onUpdate: ({ editor }) => {
      const doc = editor.state.doc;
      const canonicalText = getTextFromDoc(doc);
      const rawRuns = getRunsFromDoc(doc);
      const safeRuns = normalizeFormulaRuns(canonicalText, rawRuns);
      onChange(canonicalText, safeRuns);
    },
    onTransaction: ({ editor }) => {
      updateMarks(editor);
    },
    onBlur: ({ event }) => {
      if (!toolbarRef.current?.contains(event.relatedTarget as Node | null)) {
        dismissedSelection.current = editor?.state.selection ?? null;
        editor?.view.dispatch(editor.state.tr.setMeta(menuKey, "hide"));
      }
    }
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    
    const currentText = getTextFromDoc(editor.state.doc);
    const currentRuns = getRunsFromDoc(editor.state.doc);
    
    if (currentText !== value || JSON.stringify(currentRuns) !== JSON.stringify(runs || [])) {
      const html = createHtmlFromRuns(value, runs);
      editor.commands.setContent(html, { emitUpdate: false, parseOptions: { preserveWhitespace: "full" } });
    }
  }, [value, runs, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !toolbarRef.current) return;
    
    const plugin = BubbleMenuPlugin({
      pluginKey: menuKey,
      editor,
      element: menuElement,
      appendTo: () => document.body,
      updateDelay: 0,
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 10,
        flip: { padding: 10 },
        shift: { padding: 10 },
      },
      shouldShow: ({ view, state }) => {
        // Plugin visibility is evaluated before onSelectionUpdate callbacks.
        // Dismiss only this range, so a new selection can show immediately.
        if (dismissedSelection.current?.eq(state.selection)) return false;
        dismissedSelection.current = null;
        if (state.selection.empty) return false;
        const toolbarHasFocus = toolbarRef.current?.contains(document.activeElement);
        if (!view.hasFocus() && !toolbarHasFocus) return false;
        return true;
      }
    });
    menuElement.className = "z-[70]";
    editor.registerPlugin(plugin);
    return () => {
      editor.unregisterPlugin(menuKey);
    };
  }, [editor, menuKey, menuElement]);

  if (!editor) return null;

  const handleToolbarKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      editor.commands.focus();
      dismissedSelection.current = editor.state.selection;
      editor.view.dispatch(editor.state.tr.setMeta(menuKey, "hide"));
      return;
    }
    
    const buttons = Array.from(toolbarRef.current?.querySelectorAll('button') || []);
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % buttons.length;
      buttons[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[nextIndex]?.focus();
    }
  };

  return (
    <div className="relative w-full inline-editor-wrapper" style={getInlineHighlightStyle(presentationTheme)}>
      <EditorContent editor={editor} className="w-full" />
      {createPortal(
        <div 
          ref={toolbarRef}
          role="toolbar"
          aria-label="Text formatting"
          style={getInlineHighlightStyle(presentationTheme)}
          className="z-[70] flex items-center gap-1 bg-popover border border-border shadow-md rounded-md p-1 min-h-[44px]"
          onPointerDown={(event) => {
            // Pointer activation should not collapse native text selection.
            // Keyboard users can still Tab into and navigate the toolbar.
            event.preventDefault();
          }}
          onKeyDown={handleToolbarKeydown}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null) &&
              !editor.view.dom.contains(event.relatedTarget as Node | null)) {
              dismissedSelection.current = editor.state.selection;
              editor.view.dispatch(editor.state.tr.setMeta(menuKey, "hide"));
            }
          }}
        >
          <Tooltip>
          <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => toggleExpandedMark(editor, 'bold')}
            data-state={activeMarks.bold ? 'on' : 'off'}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-2 focus-visible:outline-none aria-pressed:bg-muted aria-pressed:text-foreground text-muted-foreground transition-colors"
            aria-pressed={mixedMarks.bold ? 'mixed' : activeMarks.bold}
            aria-label="Bold"
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          </TooltipTrigger>
          <TooltipContent>Bold (Ctrl/Cmd+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
          <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => toggleExpandedMark(editor, 'underline')}
            data-state={activeMarks.underline ? 'on' : 'off'}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-2 focus-visible:outline-none aria-pressed:bg-muted aria-pressed:text-foreground text-muted-foreground transition-colors"
            aria-pressed={mixedMarks.underline ? 'mixed' : activeMarks.underline}
            aria-label="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          </TooltipTrigger>
          <TooltipContent>Underline (Ctrl/Cmd+U)</TooltipContent>
          </Tooltip>
          <Tooltip>
          <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => toggleExpandedMark(editor, 'highlight')}
            data-state={activeMarks.highlight ? 'on' : 'off'}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-2 focus-visible:outline-none aria-pressed:bg-muted aria-pressed:text-foreground text-muted-foreground transition-colors"
            aria-pressed={mixedMarks.highlight ? 'mixed' : activeMarks.highlight}
            aria-label="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          </TooltipTrigger>
          <TooltipContent>Highlight</TooltipContent>
          </Tooltip>
          <div className="w-[1px] h-6 bg-border mx-1" />
          <Tooltip>
          <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              const { from, to, empty } = editor.state.selection;
              if (empty) return;
              
              const doc = editor.state.doc;
              const canonicalText = getTextFromDoc(doc);
              const offsetFrom = mapPosToTextOffset(doc, from);
              const offsetTo = mapPosToTextOffset(doc, to);
              
              const ranges = getInlineFormulaRanges(canonicalText) || [];
              let newOffsetFrom = offsetFrom;
              let newOffsetTo = offsetTo;
              
              for (const r of ranges) {
                if (Math.max(offsetFrom, r.from) < Math.min(offsetTo, r.to)) {
                  newOffsetFrom = Math.min(newOffsetFrom, r.from);
                  newOffsetTo = Math.max(newOffsetTo, r.to);
                }
              }
              
              const newFrom = mapTextOffsetToPos(doc, newOffsetFrom);
              const newTo = mapTextOffsetToPos(doc, newOffsetTo);
              
              editor.chain().focus().setTextSelection({ from: newFrom, to: newTo }).unsetAllMarks().run();
            }}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-muted focus-visible:ring-2 focus-visible:outline-none text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Clear formatting"
          >
            <X className="w-4 h-4" />
          </button>
          </TooltipTrigger>
          <TooltipContent>Clear formatting</TooltipContent>
          </Tooltip>
        </div>
      , menuElement)}
    </div>
  );
}