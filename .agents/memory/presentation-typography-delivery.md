---
name: Presentation typography delivery
description: The font-loading boundary between exposed appearance systems and legacy saved appearances.
---

Exposed presentation appearances should bundle only the font families and weights
they actually use. Legacy saved appearance systems should remain readable through
explicit script-capable and system fallback stacks rather than reintroducing a
runtime font CDN or shipping unused families.

**Why:** Presentation and PNG export need to work without an external font
service, while legacy appearance IDs still need a safe rendering path. Bundling
every historical family would increase payload and export complexity without
improving the current teacher-facing choices.

**How to apply:** When adding an exposed appearance, add its required local
weights, license attribution, and export readiness request together. Keep
fallback stacks explicit for multilingual and legacy content.