---
name: Proxied wheel handlers
description: Browser-safe interaction guidance for wheel-driven controls in proxied React apps.
---

In proxied React apps, wheel handlers should avoid calling `preventDefault`; the browser may treat the listener as passive. Use overscroll containment while applying the signed wheel delta to the bounded value.

**Why:** Passive-listener behavior can make one direction of wheel changes unreliable and emit a browser warning.

**How to apply:** Use this pattern for wheel-driven controls and verify both scroll directions in a real browser, not only through synthetic component events.