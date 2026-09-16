---
name: Compact timer ring sizing
description: Responsive sizing constraint for the circular timer control in Present mode.
---

The compact timer ring must allocate enough space for the enlarged tabular time reading, including clearance from the text rectangle's corners to the inner stroke. Inline containment alone is not enough for a circular boundary.

**Why:** Intrinsic button sizing can exceed a fixed circular shell even when the surrounding header grid fits, causing the live timer trigger to clip past the viewport. Text can also fit the ring's horizontal diameter while its corners crowd the stroke.

**How to apply:** When changing compact timer typography or ring dimensions, verify the trigger and ring bounds together at narrow projector and zoom-equivalent viewports, and keep the button shrinkable without clipping its reading. Check the farthest actual text-range corner against the circle's inner radius; keep the controls panel outside any circular clipping treatment.