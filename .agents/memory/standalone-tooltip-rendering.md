---
name: Standalone tooltip rendering
description: Provider requirements for accessible tooltip consumers in isolated UI tests
---

Radix tooltip consumers should remain safe when a component is rendered outside the full application shell.

**Why:** Boardwork’s page and component tests mount UI in isolation, while Radix requires tooltip content to be inside a provider; relying only on the app root causes otherwise unrelated component tests to fail.

**How to apply:** Keep shared tooltip primitives provider-safe for isolated renders, and test keyboard focus behavior with a zero-delay provider when asserting tooltip content.