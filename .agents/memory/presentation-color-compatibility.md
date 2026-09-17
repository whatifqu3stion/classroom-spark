---
name: Presentation color compatibility
description: Defines how the surface-first presentation color system coexists with saved legacy and custom appearances.
---

New presentation colors should be selected as a calm surface plus a small curated accent, while saved legacy curated IDs must resolve to their original palettes rather than falling back to the new default.

**Why:** Teachers may reopen activities created with an older appearance catalog, and silently changing those colors undermines trust in saved classroom materials.

**How to apply:** Keep retired IDs in a read-only compatibility resolver. Persist accent choices only for new curated surfaces; keep saved custom anchors readable without reintroducing manual palette controls or using them as new-activity defaults.

Use a shared neutral selection treatment for background and accent choices; preview the palette in matching swatches, not in the button's selection border or checkmark.

**Why:** The teacher found the picker confusing when light background choices had faint checks while dark accents had strong tinted borders and extra swatch rings. Selection strength must not depend on which color is selected.

**How to apply:** Preserve equal dimensions and checkmark placement across both rows, including in dark mode. Palette changes should not change the visual meaning of selected, hovered, or focused.

Inline highlights belong to the chosen presentation accent, not the teacher-interface accent or an independent stored highlight color.

**Why:** The user explicitly chose accent-linked emphasis so existing highlighted words stay coordinated when the presentation appearance changes. The usual dark interface foreground is not guaranteed to reach 4.5:1 against every possible custom accent.

**How to apply:** Keep highlight marks semantic and resolve their colors consistently in the editor, formula previews, Present, and PNG export. Choose the higher-contrast black/white foreground without modifying the presentation palette itself.