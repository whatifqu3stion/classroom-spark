---
name: Touch presentation controls
description: Touch-safe interaction and geometry rules for floating controls in Present mode
---

Treat touch taps as click toggles, not as hover or focus-reveal events. Pointer-induced focus can run before or after the click depending on the browser, so it must not compete with the toggle state; keyboard focus should still reveal or enter the panel when navigating without a pointer.

Floating controls should expose their positioned wrapper as the accessible panel and give that wrapper a real width and height. An absolutely positioned child inside a zero-size wrapper can look visible while reporting a zero bounding box to assistive tooling and viewport checks.

Present disclosures should cap their vertical size against the dynamic viewport and contain their own scroll when zoom or text scaling makes the effective screen short. Action rows must be allowed to wrap and shrink rather than create horizontal overflow.

**Why:** Touch-emulated browser checks exposed repeated taps that left panels open or made `aria-expanded` disagree with the visible state, plus a visible compact timer whose wrapper measured 0×0.

**How to apply:** For Present controls, gate hover state on pointer type, treat non-mouse pointer-down events as touch-like when clearing transient hover/focus state, avoid opening on focus of the toggle itself, place sizing/positioning on the element carrying the panel id, and use dynamic viewport max-heights for disclosure panels.