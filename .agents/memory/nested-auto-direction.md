---
name: Nested automatic direction
description: Where browser checks should assert resolved direction when authored content has nested bidi boundaries.
---

Assert `dir="auto"` and resolved `:dir()` state on the innermost direction-aware element that owns the authored text, not on an outer layout wrapper when a child establishes its own automatic direction boundary.

**Why:** An outer wrapper can continue to report its inherited left-to-right direction when its nested text component isolates and correctly resolves right-to-left content. Checking the outer element creates a false regression even though the visible text is correctly directed.

**How to apply:** In multilingual browser coverage, locate the actual authored-text boundary for direction assertions, then check containment and wrapping separately on the surrounding layout element.