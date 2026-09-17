---
name: Inline editor compatibility
description: Non-obvious compatibility risks when extending Boardwork's contextual rich-text editor.
---

Opening an existing plain-text board must not normalize its whitespace or cause a save.

**Why:** Rich editors commonly parse HTML with whitespace collapsing and can emit changes when content is loaded programmatically. Neither behavior matches the old plain-text editor, and merely opening a teacher's saved board must not rewrite it.

**How to apply:** Preserve authored spaces and breaks in initial parsing as well as subsequent synchronization. Treat incoming saved content as synchronization, not a user edit, and verify zero writes on an untouched legacy board.

Use the installed bubble-menu API rather than older Tiptap examples; treat portaled controls as a separate theme boundary.

**Why:** The installed editor uses the Floating UI generation of the bubble menu, not older Tippy options. Moving its toolbar outside the scrolling editor avoids clipping but also removes inherited presentation-accent variables.

**How to apply:** Check current package typings before changing menu positioning or lifecycle. Retain explicit theme variables on floating controls, and distinguish focus moving into the toolbar from focus leaving the editing interaction.