---
name: Large timer reading sizing
description: Responsive sizing constraint for the full-size timer card in Present mode.
---

The full-size Present timer reading should be an intrinsic, left-aligned one-line item inside the fluid card. Use available inline size and reading length as the primary scale; keep the progress and control rows full width. For short screens, reduce the width coefficient rather than adding a fixed viewport/rem ceiling.

**Why:** Grid stretch makes the painted digits look like they have unexplained trailing space, while a fixed projection-scale font can let values such as `100:00` overflow a narrow rail. Viewport/rem caps cause a plateau: the pane keeps widening but the numerals stop growing, undermining the teacher's resize control.

**How to apply:** Measure actual numeral bounds at several divider positions at one fixed viewport, not just the card width. Keep the countdown state, accessibility announcements, timer controls, and export layout on their existing paths.

Wait for grid layout and container-query typography to settle before comparing numeral metrics after a resize (two animation frames is sufficient in the browser regression harness).

**Why:** The divider's ARIA value can update before the container-query font resolves against its new track width; an immediate measurement can misleadingly report growth in the wrong direction even when the subsequent screenshot is correct.