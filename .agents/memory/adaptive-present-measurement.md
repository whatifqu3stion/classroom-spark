---
name: Adaptive Present measurement
description: How to measure room-aware Present typography without transient states or footer-driven drift.
---

Measure adaptive typography candidates in an offscreen clone that preserves the real surface, main container, and content hierarchy. Do not apply temporary candidate states to the live board.

**Why:** Measuring candidates on the live surface can trigger ResizeObserver feedback and make the board oscillate between room states. A clone that omits the main container can also produce incorrect widths because Present uses that element as a layout and query container.

When footer-only content must not alter student typography, derive capacity from actual main and footer geometry, then normalize out only the footer height above its baseline minimum.

**How to apply:** Use this approach whenever Present sizing depends on rendered line wrapping, column-divider width, or available vertical room. Keep editor preview and fixed export outside the adaptive classifier.

Use a fresh, intrinsic content probe for each bounded candidate, with the candidate's dimensions applied before insertion. Never measure a stretched rail-height grid item. Set custom CSS properties with `style.setProperty`, not object assignment.

**Why:** Chromium retained the first computed descendant sizes when a reused offscreen query-container probe changed inherited variables—even direct child style changes were deferred. That falsely accepted the largest candidate and overflowed a short 720px board. Fresh candidate trees measured correctly.

Choose growth from actual rendered space, not character-count density cutoffs, and retain a readable floor when long content cannot fit.

**Why:** The teacher wants proportional whitespace and classroom-readable copy; an extra character must not suddenly shrink the whole board. Scrolling exceptional long content is preferable to tiny type.

**How to apply:** Base capacity on viewport and fixed layout reserves rather than live content height. Preserve forced font invalidations when coalescing resize events; changing to an already-loaded typography also requires remeasurement.

Treat student prompt size as a first-class fitting objective: hold spacing at a comfortable minimum while fitting type, then add only capped residual spacing. Do not let the task's cap stop prompt growth.

**Why:** Coupled gap/type growth and an additional proportional reserve after layout reserves left useful projection capacity unused. A large headline alone does not improve the readability of students' next steps.

**How to apply:** Judge changes with measured marked-text reproductions and separate type, spacing, and available-width effects. Keep provenance notes outside authored fixture captions: adding explanatory captions changes rail geometry and invalidates a screenshot comparison.