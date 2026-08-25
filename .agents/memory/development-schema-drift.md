---
name: Development schema drift
description: A development database migration ledger may report a migration as applied while its schema change is still missing.
---

When a current Drizzle schema query fails because a column is missing, inspect both `information_schema.columns` and the Drizzle migration ledger before changing application code. The ledger can be ahead of the actual development table.

**Why:** The development database once reported the latest migration as applied even though its additive column was absent, causing every app-state load to return 500.

**How to apply:** Repair only the confirmed missing additive schema change in development, then restart the affected workflow and re-run the endpoint check. Do not treat this as evidence that the application query is wrong.
