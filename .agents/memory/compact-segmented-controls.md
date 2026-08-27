---
name: Compact segmented controls
description: Responsive rules for setup segmented controls at very narrow widths
---

Segmented controls in the Boardwork setup flow must allow equal tracks to shrink, wrap labels, and stack icon/label content at very narrow widths.

**Why:** A 287px browser viewport exposed content-based button minimums that pushed the technology selector beyond the page edge and made icons overlap labels.

**How to apply:** Keep the control root and each option `min-width: 0`; use a grid when equal compact tracks are intended; allow label wrapping; and switch to a compact stacked icon/label treatment below the narrow-layout breakpoint.