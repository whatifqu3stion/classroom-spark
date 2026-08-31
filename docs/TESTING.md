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
