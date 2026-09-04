---
name: Tall Present dock reachability
description: Accessibility and scrolling constraints for teacher controls below content-tall Present boards
---

The Present teacher dock stays in normal document flow so it cannot cover student content. When it opens after the page has already reached the old document bottom, its newly added height can extend below the viewport; scroll the dock into view after opening and return focus to its toggle when closing.

**Why:** Content-tall and zoom-equivalent boards put the footer below the initial viewport. A dock that only relies on its normal-flow position can become partially unreachable after opening, and Escape or touch closure can otherwise leave keyboard focus in a hidden panel.

**How to apply:** Keep the dock and panel in normal flow, use a bounded panel with safe-area-aware sizing, scroll the dock into view when the open state changes, and make the dock toggle the predictable focus target after close.