---
name: Multi-visual payload compatibility
description: Constraints for persisting multiple classroom presentation visuals without breaking legacy image clients.
---

Keep the aggregate request budget large enough for two individually supported image data URLs, while retaining a separate per-image decoded-size check. API reads and duplication should canonicalize legacy visual fields into the ordered visual list, and legacy PATCH updates must preserve any canonical tail image.

**Why:** A per-image limit alone can make two valid images fail at the request parser, while rows created before the visual-list migration otherwise return an empty list to newer clients.

**How to apply:** When adding more presentation media, update the request budget, read/duplicate normalization, and legacy update semantics together; validate non-empty URLs at the API contract boundary.