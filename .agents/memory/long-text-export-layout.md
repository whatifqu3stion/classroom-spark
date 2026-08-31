---
name: Long text export layout
description: Layout decision for long multilingual text in fixed-size Boardwork PNG exports
---

Fixed-size 1920×1080 board exports should use the full available content width when no visual or timer rail is present; exported title, task, and prompt blocks should have enough wrapping width for long mixed-direction text.

**Why:** Long RTL/LTR paragraphs can exceed the fixed export height when an empty rail and narrow character-based max-widths force unnecessary wrapping, causing the hidden export surface to clip content.

**How to apply:** Preserve the two-column composition for exports that include a visual or timer. For content-only exports, remove the empty rail and widen the text blocks, while retaining explicit overflow wrapping for long headings.