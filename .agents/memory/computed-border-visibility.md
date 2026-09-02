---
name: Computed border visibility
description: Browser assertions for Tailwind borders with zero width
---

When verifying that a Tailwind element has no visible border, assert `border-width: 0px` rather than requiring `border-style: none`.

**Why:** The global Tailwind reset can report a solid border style even when the element has zero border width, so style-only assertions misclassify borderless elements.

**How to apply:** Use computed border width for visible-frame checks and pair it with radius, bounds, and scroll-width assertions when testing nested workspace framing.