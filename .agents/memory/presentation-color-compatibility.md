---
name: Presentation color compatibility
description: Defines how the surface-first presentation color system coexists with saved legacy and custom appearances.
---

New presentation colors should be selected as a calm surface plus a small curated accent, while saved legacy curated IDs must resolve to their original palettes rather than falling back to the new default.

**Why:** Teachers may reopen activities created with an older appearance catalog, and silently changing those colors undermines trust in saved classroom materials.

**How to apply:** Keep retired IDs in a read-only compatibility resolver. Persist accent choices only for new curated surfaces; keep saved custom anchors readable without reintroducing manual palette controls or using them as new-activity defaults.