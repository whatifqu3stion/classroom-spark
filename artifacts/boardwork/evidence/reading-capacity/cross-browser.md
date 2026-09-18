# Reading-capacity cross-browser verification

Verified on 2026-09-18 using Playwright 1.62.1, Firefox 153.0 and
Playwright WebKit 26.5. Chromium was the unchanged-layout control.
WebKit coverage is engine-level Linux coverage, not a claim of testing
macOS/iOS Safari hardware.

## Results

| Coverage | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| 24 marked Design Critique fixtures | Pass | Pass | Pass |
| Divider, viewport, rail mode, font event, fullscreen convergence | Pass | Pass | Pass |
| No fitting on timer ticks | Pass | Pass | Pass |
| Hidden/inert/offscreen candidate probes, no retained probes | Pass | Pass | Pass |
| Bold, highlight, underline preserved; no text-box overflow | Pass | Pass | Pass |
| Editor-preview and fixed PNG surface geometry | Pass | Pass | Pass |

Fixtures cover two themes, with and without an image alongside the timer, at
1024×525, 1280×720, 1920×1080, 1024×768, 800×600 and 390×844.
Per-browser geometry and representative screenshots are in
`after/chromium`, `after/firefox` and `after/webkit`.

No application hook, presentation CSS, editor-preview layout, or PNG-export
layout was changed.

## Test-harness corrections

- Exact Chromium interior rectangles differ from Firefox/WebKit by less than
  0.1 CSS pixel. Chromium retains its exact historical comparison. The other
  engines allow at most 0.1 pixel for interior coordinates; frame geometry,
  task font sizes and inactive fitting attributes remain exact.
- Previously, the convergence test summed probes across opening the teacher
  dock, hiding the large timer, and showing compact controls. Firefox produced
  52 probes across those separate transitions. Each action now has its own
  bounded budget and quiet-period assertion.
- Firefox fullscreen entry produced 23 probes across fullscreen and resize
  events in separate frames. Entry and exit now use the same 40-probe ceiling
  as viewport resize, with a quiet-period assertion after each.

Initial runs covered each engine's complete suite. Only failing/changed
convergence and baseline checks were rerun after these corrections. The final
targeted convergence pass passed all three engines; the fixed-layout pass
passed all three engines separately. Typecheck and `git diff --check` passed.

## Running again

Standard environment:

```sh
pnpm --filter @workspace/boardwork run test:reading-capacity:browsers
```

The workspace's system dependency configuration includes the browser runtime
libraries. Here, Playwright's WebKit host validator still reports GTK/media
dependencies even though the headless WPE browser launches and renders.
After independently confirming actual WebKit launch and page rendering, the
verification used:

```sh
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 pnpm --filter @workspace/boardwork exec playwright test reading-capacity.e2e.spec.ts --project=firefox --project=webkit --workers=1
```

This override skips only Playwright's host-library preflight, not browser
execution or any assertions. It is not a default in project configuration.
Do not use it to mask actual browser launch errors.

Font coverage waits for `document.fonts.ready` and explicitly dispatches
`loadingdone`; delayed or failed font network requests are not simulated here.