---
name: OpenAPI bounded whole-minute values
description: How to express bounded whole-minute numeric values in this workspace's OpenAPI and generated Zod contracts.
---

Use `type: number` with `multipleOf: 1`, `minimum`, and `maximum` for bounded whole-minute values in the OpenAPI spec. The installed Zod version does not support the `zod.int()` helper that Orval emits for `type: integer` ranges.

**Why:** Orval generated `zod.int()` from an OpenAPI integer range, but this workspace uses a Zod version without that API, causing the required codegen typecheck to fail.

**How to apply:** Keep user-facing forms and domain validators explicitly whole-number validated, then rerun `pnpm --filter @workspace/api-spec run codegen` after changing the spec.