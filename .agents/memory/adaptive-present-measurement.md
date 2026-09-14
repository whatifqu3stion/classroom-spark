---
name: Adaptive Present measurement
description: How to measure room-aware Present typography without transient states or footer-driven drift.
---

Measure adaptive typography candidates in an offscreen clone that preserves the real surface, main container, and content hierarchy. Do not apply temporary candidate states to the live board.

**Why:** Measuring candidates on the live surface can trigger ResizeObserver feedback and make the board oscillate between room states. A clone that omits the main container can also produce incorrect widths because Present uses that element as a layout and query container.

When footer-only content must not alter student typography, derive capacity from actual main and footer geometry, then normalize out only the footer height above its baseline minimum.

**How to apply:** Use this approach whenever Present sizing depends on rendered line wrapping, column-divider width, or available vertical room. Keep editor preview and fixed export outside the adaptive classifier.