---
name: Countdown alarm behavior
description: Durable design rules for the classroom countdown's timing, alarm, and export behavior.
---

The presentation countdown must calculate remaining time from an absolute end timestamp, re-check when the document becomes visible, and keep completion alarm state local to the presentation session. Export canvases must never receive live timer or teacher-control UI.

**Why:** Background-tab throttling can delay interval callbacks, while a saved activity should remain unchanged by temporary presentation controls and PNG exports should contain only the student-facing board.

**How to apply:** Preserve timestamp-based timing and visibility re-checks when changing timer behavior; treat alarm dismissal, pause/resume, reset, visibility, and sound settings as presentation-only state.