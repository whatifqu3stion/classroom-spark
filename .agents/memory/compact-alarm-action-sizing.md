---
name: Compact alarm action sizing
description: Responsive sizing constraint for the compact Present timer after completion.
---

When the compact timer enters its alarm state, Dismiss joins Start, Adjust, and Expand in the same action row. The panel and flex allocation must reserve enough room for the longer Dismiss label without wrapping, clipping, or pushing the panel beyond the viewport.

**Why:** The idle and running states have three actions, so a layout that fits those states can regress as soon as completion adds Dismiss.

**How to apply:** Test the completed state separately at zoom-equivalent and very narrow classroom widths. Keep Dismiss keyboard-focusable and verify that dismissing the alarm removes only that action while leaving Adjust and Expand available.