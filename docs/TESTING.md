# Boardwork — MVP Acceptance Tests

A feature is not “done” because it exists. The following behaviors should work end to end.

## A. Access protection
- [ ] Published app is not openly usable by an unintended visitor.
- [ ] Deployment-level privacy/password protection is used if available.
- [x] If fallback `APP_PASSWORD` is needed, it is checked server-side.
- [x] No API key or app password appears in client code, rendered HTML, or user-visible logs.

## B. Class setup
- [x] Teacher can create a class with name, grade, and subject.
- [x] Teacher can add optional course context, current unit, arrival instructions, default mode, and duration.
- [x] Teacher can edit the class later.
- [x] Class context persists after refresh.

## C. Chips
- [x] Teacher can add a chip in a few keystrokes.
- [x] Teacher can select multiple chips.
- [x] Teacher can remove/edit a chip.
- [x] Chips remain associated with the correct class.
- [x] Selected state is visually obvious and keyboard accessible.

## D. Generate
- [x] Start Blank reaches an editable board without any AI request.
- [x] Teacher can generate with only a class selected.
- [x] Teacher can generate using topic + goal + chips.
- [x] Device Off produces no required web/device action.
- [x] Device On never invents a URL.
- [x] Generated activity fits the requested 5/7/10 minute category.
- [x] Output is concise enough to project.
- [x] Generate button cannot fire duplicate overlapping requests.
- [x] Generation error preserves inputs and offers Retry.
- [x] Device On renders only a validated teacher-supplied HTTP(S) resource link.

## E. Editing
- [x] Teacher can directly change generated title.
- [x] Teacher can directly change task.
- [x] Teacher can edit/remove prompt bullets.
- [x] Teacher can change displayed duration.
- [x] Edits persist after refresh.

## F. Presentation
- [x] Present opens a dedicated clean view.
- [x] No teacher editing controls appear on the student board.
- [x] Countdown timing uses an absolute deadline, catches up after visibility changes, and preserves remaining time across pause/resume.
- [x] Timer reset and one-minute adjustments work from idle, paused, running, and completed states.
- [x] Timer alarms honor mute, repeat until dismissed, and remain compatible with reduced-motion presentation styles.
- [x] Hiding the timer changes student visibility only; the live session and PNG export surface remain separate.
- [x] Board looks intentional at 1280×720.
- [x] Board looks intentional at 1920×1080.
- [x] Projector-resolution typography, contrast, hierarchy, and layout pass at 1280×720 and 1920×1080.
- [x] Physical classroom projector/distance observation is complete.
- [x] Arrival instruction is visually secondary.
- [x] Fullscreen action works in supported browsers.
- [x] Long AI text does not create tiny unreadable typography; content constraints/layout protect readability.
- [x] Teacher-only notes never appear on the student board.

## G. History
- [x] Successful generations are not lost on refresh.
- [x] History shows recent activities by class/date.
- [x] Teacher can open an old activity.
- [x] Teacher can present an old activity.
- [x] Teacher can duplicate/remix an old activity.
- [x] Teacher can favorite and delete.

## H. Export
- [x] Teacher can export a board as PNG.
- [x] Export contains the presentation board only.
- [x] Export is 16:9 and suitable for inserting into Google Slides.
- [x] Export text is crisp enough at normal slide size.

## I. Responsive UX
- [x] Teacher can generate comfortably from a phone.
- [x] Teacher can select class/chips without precision tapping.
- [x] Main desktop experience does not look like a generic admin dashboard.
- [x] No horizontal scrolling on normal phone widths.

## J. Product quality gate
Before calling MVP complete:
- [x] A new activity can be generated from the class page in under 60 seconds without reading documentation.
- [x] “Surprise Me” creates something genuinely usable from class context alone.
- [x] Student-facing language is direct and age appropriate.
- [x] Presentation screen can be understood in roughly five seconds.
- [x] There are no visible AI clichés, model controls, or prompt-engineering UI.
- [x] There are no features unrelated to the documented core loop.

## Stage 4 verification notes
- Browser acceptance covered fresh class setup, class sorting/colors, instructional context, class-scoped chips, real Generate, Surprise Me, Start Blank, editing, autosave, direct-route refresh, History, Favorite, Remix, Present, fullscreen, and export.
- A fresh visible-product-only timing pass measured 11.5089 seconds from the first topic/goal interaction on a ready class page to a saved generated activity, with one generation request and no documentation.
- An independent five-second comprehension proxy correctly identified the title, duration, materials, and first student action. This is not a claim about an actual classroom cohort.
- Presentation was checked at 1920×1080, 1280×720, and 390×844 with 0, 1, and 3 prompts; short and wrapping titles; long valid task text; materials; and footer present/absent.
- Projector-resolution checks measured 64px title / 30.08px task text at 1280×720 and 92.8px title / 48px task text at 1920×1080, with strong contrast and no clipping or overlap. A physical room/projector/distance observation remains manual.
- Downloaded PNGs were inspected as 1920×1080 images. Desktop- and portrait-triggered exports produced the same 16:9 composition with no controls or teacher-only notes.
- Multilingual manual acceptance: in a browser with the relevant fonts available, enter short and long accented/combining, Arabic or Hebrew RTL, Devanagari, and CJK strings in a class name, chip, class context, activity, and note. Refresh, edit/autosave, open History, duplicate, Present, and export at mobile, 1280×720, and 1920×1080. Confirm visible characters, authored casing, punctuation, and readable mixed-direction layout remain intact; inspect the downloaded PNG for the same glyphs and no replacement boxes.
- Unicode contract: request boundaries remove unsafe invisible controls (including bidi embeddings and zero-width spaces) but preserve visible Unicode code points, combining marks, and Arabic/Indic ZWJ/ZWNJ shaping joiners. No ASCII folding or compatibility normalization is applied. The document loads Inter plus Noto Arabic, Hebrew, Devanagari, and Japanese fallbacks and waits for them before PNG capture; system sans-serif remains the offline fallback.
- Practical failure checks covered invalid URLs, retained generation inputs, export failure/retry, malformed AI output, missing AI configuration, and application-load retry behavior. A destructive live database outage was not induced.
- The project was not published during Stage 4, so production database, AI, direct-route, asset, export, and access-protection checks remain pending until the first deployment.

## Stage 5 production verification

- Production verification is blocked as of August 21, 2026: the deployment service reports no active published deployment, so there is no live URL against which to run the access-gate, real-AI persistence, direct-route, projector-asset, fullscreen, or PNG-export smoke tests.
- The remaining unchecked access and production items require a published deployment; the physical classroom projector/distance observation is recorded below.
- Local production builds succeed when the required `PORT` and `BASE_PATH` values are supplied. The development database is synchronized with the current Drizzle activity schema, including `activities.visual_url`; the API app-state check, typecheck, and persistence suite pass locally. Production schema changes remain Publish-flow work.

## Stage 5 local PNG typography verification

- On August 25, 2026, a browser pass selected every exposed typography pairing on one mixed-script activity and inspected the actual downloaded PNG bytes: Boardwork, Editorial, Structured, and Clear.
- Each desktop export was a non-interlaced RGBA PNG at exactly 1920×1080. A portrait/mobile-triggered Clear export kept the same fixed dimensions.
- Computed presentation styles matched the selected heading/body pairs: Inter 700/500, DM Serif Display 400 + DM Sans 500, IBM Plex Serif 600 + IBM Plex Sans 500, and Atkinson Hyperlegible 700/500. Pixel comparisons were non-zero across every pairing, and zoomed crops showed accented/combining, Arabic, Devanagari, and CJK glyphs without replacement boxes.
- The downloaded images contained the student board only: no Back, Export PNG, Teacher controls, timer panel, live alarm state, timer controls, or teacher-only note. The student-facing `7 MIN` board badge remained as intended.
- All bundled font assets returned HTTP 200 with `font/ttf`; after `document.fonts.ready` and explicit requested-face loads, every exposed face reported `loaded` and `document.fonts.check()` returned true. No app-side console or backend errors were observed.

## Stage 5 projector-readability verification

- On August 31, 2026, a classroom projector review at the intended viewing distance found the countdown, completion state, and teacher-only controls generally clear and distinguishable. The review identified excess unused vertical space in the left content column, with bullet points feeling crowded and too small.
- The presentation now uses the left column more flexibly: normal boards receive larger, more widely spaced bullets, while unusually long boards use a content-aware compact treatment to keep all prompts visible at shorter projector heights.
- A focused browser viewport proxy pass rechecked Present at 1920×1080 and 1280×720. The long content-dense fixture kept every prompt inside both viewports; normal boards retained the larger airy treatment. Running and completed countdown states remained readable, and teacher controls did not obscure the board.
- Proxy measurements after the adjustment: at 1920×1080, dense prompts measured 27px with 32.4px line height; at 1280×720, dense prompts measured 18px with 20.7px line height, while normal prompts measured 28.16px with 36.608px line height. No browser console, page, or network errors were observed.

## Stage 5 timer-readability regression coverage

- [x] Compact Present timers use a 7.5rem circular control with a 1.75rem ordinary reading, preserve the `4 / reading.length` scale for `100:00` and `1000:00`, keep at least 6px from every text-range corner to the inner ring stroke, and keep the transparent wrapper transparent through light/dark hover and focus states.
- [x] Large Present timers size from the usable rail rather than viewport plateaus. The focused browser check measures actual numeral ranges and computed font sizes at rail-wide, default, and rail-narrow divider positions in both split and timer-only modes at 1920×1080 and 1280×720, including reverse resizing and repeated-read stability.
- The focused unit command is `pnpm --filter @workspace/boardwork exec vitest run --config vitest.config.ts src/components/presentation-canvas.test.tsx`; do not use `pnpm test --`, which runs the whole suite.
- The focused browser command batches the new sizing/compact checks with the existing disclosure, touch, keyboard-focus, alarm, and export checks:
  `pnpm --filter @workspace/boardwork exec playwright test src/pages/present.e2e.spec.ts --grep "sizes large timer numerals|contains large 1000:00 timer cards|keeps compact readings clear|keeps a multi-digit compact timer reading|keeps compact timer primary actions|keeps compact timer dismiss|restores hidden timer actions|returns focus to the compact timer trigger|keeps Present controls tappable|exports long mixed-direction board text|keeps two ordered visuals visible"`.
- On September 16, 2026, all 13 selected browser cases passed across the initial batch and targeted failure rechecks. These cover ordinary/long sizing, light/dark compact geometry, zoom-equivalent disclosures, compact actions and alarm dismissal, keyboard focus, touch controls, and text/visual/two-visual PNG exports. Large `1000:00` readings, progress, and named actions remained contained/reachable in both modes at 1280×720, 640×400, and 320×640.
- The original 112px candidate left only 4.85px of actual text-corner clearance; increasing the circle to 120px passed the >=6px bound. Large numerals grew and shrank at every tested divider position, exceeding the former 96px and 160px ceilings at both projector sizes. Measurements wait two animation frames after divider changes so container-query typography has resolved against the new grid tracks.
- Corrected only the harness defects encountered by these focused checks: incorrect fixture/viewport/panel references, non-touch `tap`, integer-vs-subpixel label-width comparison, and fixed divider limits. The old PNG badge-area pixel check was replaced with explicit export-surface timer exclusion because authored text legitimately occupies that rectangle.
- Reviewed batched screenshots of split/timer-only projector compositions and narrow light/dark ordinary/long compact clocks. The old `present-both-present-linux.png` was inspected but left unchanged: no current test references it, and its title-bearing composition predates the current Present screen. New sizing tests attach current screenshots to Playwright results rather than silently overwriting an unused baseline.
- Timer component suites: 48 tests passed, including absolute-deadline/alarm behavior and panel-origin/visual-viewport observer cleanup. The production build passed. Full typecheck still reports 16 pre-existing errors in unchanged `home.test.tsx` and `home.e2e.spec.ts`; the broader unit run likewise found three existing Home failures. No timer-file type errors remain. Setup-test repair is tracked separately.

## Measured Present text fitting

- Live left-pane text uses rendered candidates instead of discrete room tiers or character-count density cutoffs. The focused regression checks actual font/gap growth, divider reversal, settled geometry, readable long-content flow, and unchanged export font sizes.
- Short-board coverage explicitly requires the footer to remain within 1280×720. Merely checking that text precedes the footer can miss an entire composition extending below the screen.
- Each candidate uses a fresh intrinsic clone with sizing applied before insertion. Reusing an offscreen query-container probe left descendant styles stale in Chromium and falsely accepted oversized text.
- Final verification on September 16, 2026: 43 component/helper tests, the focused responsive/divider/long-content browser regression, and the production build passed. Inspected the corrected 720p composition and the real saved board in the running preview. Related footer, mixed-script formula, rail, and export cases were also exercised during development.
- Full typecheck still has only the previously documented Home-test errors. No changed-file errors remain; setup-test repair is tracked separately.
