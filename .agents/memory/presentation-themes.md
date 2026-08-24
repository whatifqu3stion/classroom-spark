---
name: Presentation themes
description: Durable decisions for activity presentation palettes and persistence.
---

Presentation themes are presentation-only activity data: a nullable curated theme choice or custom color anchors. Activities without theme data must resolve to the readable default, while new activities can inherit the teacher’s last-used choice.

**Why:** Pedagogical activity style and presentation appearance solve different problems, and older saved activities must remain compatible without a migration-time default baked into every row.

**How to apply:** Keep theme rendering semantic and inline at the presentation surface so the live view and fixed-size PNG export use the same resolved colors; never overload the generation `style` field.

Boardwork’s default surface uses the original soft near-white background with the app’s default dark blue as its primary accent and text color. Paper remains the warmer alternative surface.

**Why:** The user clarified that Boardwork should feel like the original white design without becoming glaring, while Paper can carry the warmer tone.

**How to apply:** Keep this pairing as the default Boardwork surface and leave Paper and the other curated surfaces independent.