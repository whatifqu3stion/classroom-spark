---
name: Compact timer ring sizing
description: Responsive sizing constraint for the circular timer control in Present mode.
---

The compact timer ring must allocate enough inline space for the enlarged tabular time reading plus its internal padding; a visually smaller nominal ring can still let the button overflow its shell at zoomed widths.

**Why:** Intrinsic button sizing can exceed a fixed circular shell even when the surrounding header grid fits, causing the live timer trigger to clip past the viewport.

**How to apply:** When changing compact timer typography or ring dimensions, verify the trigger and ring bounds together at narrow projector and zoom-equivalent viewports, and keep the button shrinkable without clipping its reading.