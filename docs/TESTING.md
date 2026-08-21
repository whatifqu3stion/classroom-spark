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
- [x] Board looks intentional at 1280×720.
- [x] Board looks intentional at 1920×1080.
- [x] Projector-resolution typography, contrast, hierarchy, and layout pass at 1280×720 and 1920×1080.
- [ ] Physical classroom projector/distance observation is complete.
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
- Practical failure checks covered invalid URLs, retained generation inputs, export failure/retry, malformed AI output, missing AI configuration, and application-load retry behavior. A destructive live database outage was not induced.
- The project was not published during Stage 4, so production database, AI, direct-route, asset, export, and access-protection checks remain pending until the first deployment.

## Stage 5 production verification

- Production verification is blocked as of August 21, 2026: the deployment service reports no active published deployment, so there is no live URL against which to run the access-gate, real-AI persistence, direct-route, projector-asset, fullscreen, or PNG-export smoke tests.
- The three unchecked items above are intentionally still unchecked. They require either a published deployment (A) or a physical classroom projector/distance observation (F); marking them complete without those observations would be misleading.
- Local production builds succeed when the required `PORT` and `BASE_PATH` values are supplied. Local typecheck and persistence tests currently expose an existing database/schema mismatch (`activities.visual_url` is present in the Drizzle model but absent from the test database); this was not changed as part of a production verification task.
