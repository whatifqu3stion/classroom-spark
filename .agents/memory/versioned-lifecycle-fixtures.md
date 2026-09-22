---
name: Versioned lifecycle fixtures
description: Keep optimistic-concurrency browser and component fixtures faithful to real approval transitions.
---

Use realistic version progression in source lifecycle fixtures: creation starts at version one, and approval and edits advance it. Reject stale expected versions in mocked updates.

**Why:** A replacement check using a reviewed source that still had version one hid a hard-coded deactivation version. The real reviewed source had already advanced, so deactivation failed while the UI incorrectly reported completion.

**How to apply:** Exercise replacement with an approved source at version two or later, assert actual inactive state before completion, and include a conflict response that preserves the new draft without closing as a success. Stateful fixtures must also update subsequent list/detail responses instead of merely returning a successful mutation body.