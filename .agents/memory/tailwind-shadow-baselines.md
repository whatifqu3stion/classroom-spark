---
name: Tailwind shadow baselines
description: Avoid misleading before-and-after elevation comparisons with Tailwind-generated utilities.
---

Measure the computed shadow of an element using the original utility before choosing a new elevation or building a visual comparison.

**Why:** In Boardwork, the generated Tailwind small-shadow utility used its compiled default layers rather than the faint, similarly named root custom property. Reading only the root property understated the actual starting elevation.

**How to apply:** Use an element with the original utility to obtain the baseline. Keep card-specific elevation separate from global utilities so controls and classroom surfaces remain unchanged.