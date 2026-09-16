---
name: Command accessible names
description: cmdk search naming and active-option checks in category popovers.
---

Give cmdk's Command root a meaningful `label` when naming its search input; an input `aria-label` alone may not provide the accessible name.

**Why:** cmdk links the input to its generated label with `aria-labelledby`, which takes precedence over `aria-label`. Leaving that generated label empty produced an unnamed search combobox despite a visible aria-label attribute.

**How to apply:** Assert the resolved name with role-and-name queries, not just the presence of an aria-label attribute. Keep this localized to the relevant command instance.

For browser checks of cmdk active-option styling, move the pointer away before keyboard navigation, or deliberately hover the option before measuring hover colors.

**Why:** Pointer position during popover layout changes can replace the keyboard-active option between an attribute assertion and a computed-style read.

**How to apply:** Stabilize the intended input modality before inspecting the active option; do not treat the stored category checkmark as cmdk's keyboard highlight.