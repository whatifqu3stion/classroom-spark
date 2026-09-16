---
name: Technology setup compatibility
description: Simplified new-board choices must not reinterpret saved legacy activities.
---

Keep the two-choice setup UI separate from legacy technology normalization. A computer-enabled class selects Computer required for new boards; existing activities may still explicitly mean Computer available.

**Why:** Removing a creation option is not permission to change the requirements of already-authored classroom activities or old API clients.

**How to apply:** Restrict new setup choices locally and leave persisted enum values and shared legacy normalization compatible unless a migration is explicitly requested.