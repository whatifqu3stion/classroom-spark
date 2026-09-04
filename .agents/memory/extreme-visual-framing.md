---
name: Extreme visual framing
description: Sizing rule for portrait and landscape assets in the presentation rail
---

Presentation rail images should preserve their intrinsic aspect ratio: use intrinsic width with max-width and max-height constraints, then center the image inside its figure. Avoid forcing width to 100%, which creates a wide portrait box when max-height limits the rendered content.

**Why:** Extreme portrait assets otherwise leave misleading blank framing or appear clipped, while landscape assets still expand naturally to the available rail width.

**How to apply:** Keep the same containment rule for live Present, editor preview, and fixed-size PNG export, and cover both extremes at wide and narrow classroom sizes.