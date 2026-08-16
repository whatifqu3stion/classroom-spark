---
name: Drizzle migration paths
description: Records the package-working-directory requirement for reliable migration generation.
---

Use package-relative `schema` and `out` paths in the Drizzle config when migration scripts run through the database workspace package.

**Why:** In this workspace, Drizzle generation treated absolute output paths as relative and prefixed the package working directory, producing an invalid duplicated path even though migration application still worked.

**How to apply:** Keep the config paths relative to the database package and run generation/migration through that package’s scripts. Verify a second migration can be generated, not only that the first migration applies.