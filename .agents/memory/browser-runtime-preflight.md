---
name: Browser runtime preflight
description: Distinguishing Playwright host checks from actual WebKit engine availability in this workspace.
---

Do not infer that headless WebKit is unavailable solely from Playwright's host-library validation.

**Why:** This workspace's dependency installer supplied enough libraries for headless WPE WebKit to launch and render, while Playwright still reported missing GTK/media libraries from its broader preflight. Firefox also needed system dependencies beyond those previously installed for Chromium.

**How to apply:** Use the supported system dependency installer first. If only the broad WebKit preflight remains blocked, verify an actual headless launch and page rendering before considering a command-local preflight override. Never skip browser tests or conceal a real launch failure, and do not enable that override globally.