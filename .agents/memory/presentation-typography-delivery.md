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

Font verification in a browser should await `document.fonts.ready` and explicitly
load each exposed family/weight before interpreting `document.fonts.check()` or
inspecting export pixels.

**Why:** An early `FontFaceSet.check()` can report false while the same local
font assets are reachable and become loaded after the export preparation barrier.

**How to apply:** Treat the shared export preparation barrier as the start of
font assertions; verify the served local asset response and loaded face status
when diagnosing a PNG mismatch.

The normal Boardwork application shell remains on its established `Inter`,
`sans-serif` baseline; appearance-specific typography is scoped to presentation
surfaces and should not silently change home, editor, dialog, or navigation copy.

**Why:** Teachers noticed the broader multilingual fallback stack as an
unintended application-wide visual change even though it was useful for
presentation content.

**How to apply:** Keep app-shell font tokens separate from presentation
heading/body variables. Any future font-delivery change should verify both the
normal UI baseline and the presentation/export fallback behavior independently.

Presentation surfaces use one fixed original pairing: Inter 700 for headings and
Inter 500 for body copy, with explicit script-capable and system fallbacks.
Legacy `typographyId` values remain accepted in stored/API data but are ignored
by presentation resolution and new local preferences.

**Why:** Experimental pairings were not reliably distinguishable across editor
preview, Present, and PNG export, so a single predictable treatment is safer
for classroom use while preserving backward-compatible data shapes.

**How to apply:** Request only Inter 500/700 for presentation export; retain
other Inter weights only when needed by the teacher application shell.

Formula-aware text wrappers must inherit the surrounding presentation font;
apply the math fallback only to spans that actually contain parsed formula
notation.

**Why:** The formula renderer wraps ordinary prose and formulas in the same
component. Styling that outer wrapper as math makes every presentation option
look identical even when its surface variables and local fonts are correct.

**How to apply:** Keep the wrapper typography-neutral and scope the explicit
math stack to rendered formula spans. Verify both plain prose and a real
formula in the editor preview and Present view.