---
name: Portal form boundaries
description: Why management dialogs inside settings need a separate React form boundary even when portalled.
---

Place independent management dialogs outside the enclosing settings form in the React tree, not merely outside it in the rendered DOM.

**Why:** React portal events still bubble through their React ancestors. A source-creation form nested under a class-settings form can unintentionally submit the class form even though the dialog is portalled to the document body. Moving the manager outside the parent form preserves independent saves and focus.

**How to apply:** When adding or relocating nested editors in settings, keep each submission boundary independent. Verify that child creation, approval, replacement, and cancellation produce no parent save request.