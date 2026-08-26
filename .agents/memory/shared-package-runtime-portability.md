---
name: Shared package runtime portability
description: Runtime and type-library constraints for code shared by browser and server packages
---

Shared packages should avoid relying on DOM-only globals unless their TypeScript library configuration explicitly includes the DOM.

**Why:** API and browser packages consume the same payload-limit helpers, but the API schema package is compiled without DOM typings; a browser-native encoder caused the shared project reference build to fail even though it worked in the browser.

**How to apply:** Prefer platform-neutral helpers in shared validation modules, or isolate browser/server adapters at the package boundary.