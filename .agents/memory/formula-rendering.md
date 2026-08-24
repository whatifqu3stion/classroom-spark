---
name: Formula rendering safety
description: Durable notation and fallback rules for Boardwork math and science content.
---

Boardwork should prefer delimited formulas for longer expressions, while recognizing only clear standalone fragments such as H_2O, x^2, and supported Greek/operator commands. Unsupported commands and unmatched delimiters remain literal readable text.

**Why:** Teachers and generated activities may mix prose with short scientific notation, but broad automatic conversion would unexpectedly alter ordinary text and malformed formulas must never break a board.

**How to apply:** Keep formula output as safe React nodes/ASTs shared by the editor, presentation canvas, theme preview, and PNG export; update generation guidance and parser tests together when notation expands.

Unicode formula scans must advance by code point rather than UTF-16 code unit, and every presentation font stack should include script, symbol, and emoji fallbacks.

**Why:** Supplementary-plane characters can be split during parsing, while curated display fonts may not contain classroom math, multilingual, or emoji glyphs.

**How to apply:** Preserve unsupported notation literally, test representative Unicode symbols and emoji, and wait for the full fallback-aware font family set before PNG capture.