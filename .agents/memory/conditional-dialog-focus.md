---
name: Conditional dialog focus
description: Focus restoration when a dialog is opened outside Dialog.Trigger and its opener changes with selection.
---

Externally controlled Radix dialogs need explicit close-focus restoration when their opening button is conditional. Keep a ref to the current opener rather than the DOM node that originally received the click.

**Why:** Selecting the first item can replace an empty-state opener while the dialog is open. Default restoration then targets a removed node or the document body, despite successful selection and save behavior.

**How to apply:** Use Dialog.Trigger where its lifetime is stable; otherwise use onCloseAutoFocus with a live opener ref. Test closing after the empty-to-selected transition, and keep a management opener available even at a selection ceiling.