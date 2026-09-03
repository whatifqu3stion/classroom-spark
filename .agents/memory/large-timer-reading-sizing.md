---
name: Large timer reading sizing
description: Responsive sizing constraint for the full-size timer card in Present mode.
---

The full-size Present timer reading should be an intrinsic, left-aligned one-line item inside the fluid card. When a longer minute value cannot fit, reduce the reading using the card’s available inline size and the rendered reading length; keep the progress and control rows full width.

**Why:** Grid stretch makes the painted digits look like they have unexplained trailing space, while a fixed projection-scale font can let values such as `100:00` overflow a narrow rail.

**How to apply:** Limit this behavior to the large reading path. Keep the compact ring, countdown state, accessibility announcements, timer controls, and export layout on their existing paths.