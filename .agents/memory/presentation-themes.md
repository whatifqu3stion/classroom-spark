---
name: Presentation themes
description: Durable decisions for activity presentation palettes and persistence.
---

Presentation themes are presentation-only activity data: a nullable curated theme choice or custom color anchors. Activities without theme data must resolve to the readable default, while new activities can inherit the teacher’s last-used choice.

**Why:** Pedagogical activity style and presentation appearance solve different problems, and older saved activities must remain compatible without a migration-time default baked into every row.

**How to apply:** Keep theme rendering semantic and inline at the presentation surface so the live view and fixed-size PNG export use the same resolved colors; never overload the generation `style` field.

Boardwork’s default surface uses the Paper warm off-white background with the app’s default dark blue as its primary accent and text color.

**Why:** The user asked Boardwork to return to the original restrained look: off-white paper with the familiar dark blue default.

**How to apply:** Keep this pairing as the default Boardwork surface; do not change the other curated surfaces when adjusting the Boardwork default.