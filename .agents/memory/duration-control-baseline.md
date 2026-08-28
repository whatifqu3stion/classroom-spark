---
name: Duration control baseline
description: Boardwork's original duration presets and manual-entry behavior
---

The board setup duration control should present compact 3, 5, and 7 minute
segmented presets, alongside a keyboard-editable custom duration field. Manual
entry accepts any positive whole-minute value rather than imposing a product
cap.

**Why:** The duration roller and extra preset changed the original Boardwork
interaction. Teachers still need a quick classroom-length choice, but custom
boards may need durations longer than the old 120-minute validation ceiling.

**How to apply:** Keep preset selection separate from custom text entry, clear
the custom field when a preset is chosen, and validate only positive whole
minutes at the UI/API boundary. Preserve the existing integer database storage
and timer behavior.