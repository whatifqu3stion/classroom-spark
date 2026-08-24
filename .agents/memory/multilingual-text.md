---
name: Multilingual classroom text
description: Unicode preservation, direction handling, and export font coverage for Boardwork-authored content.
---

Boardwork preserves visible Unicode code points and combining marks, removes unsafe invisible controls at request/model boundaries, keeps Arabic/Indic ZWJ and ZWNJ shaping joiners, and uses `dir="auto"` with `unicode-bidi: plaintext` for authored runs. Presentation/export content must use the documented script-capable font stack, wait for requested fonts before capture, and leave html-to-image font embedding enabled; cross-origin font stylesheets need CORS-safe loading.

**Why:** Teacher-authored wording can mix LTR and RTL scripts, combining marks, and non-Latin writing systems; ASCII folding, compatibility normalization, blanket format-character removal, a font race, or skipping font embedding can corrupt otherwise valid classroom content or the exported image.

**How to apply:** Extend the narrow control policy only with a specific safety reason, keep labels/metadata separate from authored text styling, and exercise representative Unicode strings through generation, persistence, duplicate, presentation, and PNG export paths.