# Boardwork — MVP Acceptance Tests

A feature is not “done” because it exists. The following behaviors should work end to end.

## A. Access protection
- [ ] Published app is not openly usable by an unintended visitor.
- [ ] Deployment-level privacy/password protection is used if available.
- [ ] If fallback `APP_PASSWORD` is needed, it is checked server-side.
- [ ] No API key or app password appears in client code, rendered HTML, or user-visible logs.

## B. Class setup
- [ ] Teacher can create a class with name, grade, and subject.
- [ ] Teacher can add optional course context, current unit, arrival instructions, default mode, and duration.
- [ ] Teacher can edit the class later.
- [ ] Class context persists after refresh.

## C. Chips
- [ ] Teacher can add a chip in a few keystrokes.
- [ ] Teacher can select multiple chips.
- [ ] Teacher can remove/edit a chip.
- [ ] Chips remain associated with the correct class.
- [ ] Selected state is visually obvious and keyboard accessible.

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
- [ ] Teacher can directly change generated title.
- [ ] Teacher can directly change task.
- [ ] Teacher can edit/remove prompt bullets.
- [ ] Teacher can change displayed duration.
- [ ] Edits persist after refresh.

## F. Presentation
- [x] Present opens a dedicated clean view.
- [x] No teacher editing controls appear on the student board.
- [ ] Board looks intentional at 1280×720.
- [ ] Board looks intentional at 1920×1080.
- [x] Core task is readable at classroom distance.
- [x] Arrival instruction is visually secondary.
- [ ] Fullscreen action works in supported browsers.
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
- [ ] Teacher can export a board as PNG.
- [ ] Export contains the presentation board only.
- [ ] Export is 16:9 and suitable for inserting into Google Slides.
- [ ] Export text is crisp enough at normal slide size.

## I. Responsive UX
- [x] Teacher can generate comfortably from a phone.
- [x] Teacher can select class/chips without precision tapping.
- [ ] Main desktop experience does not look like a generic admin dashboard.
- [x] No horizontal scrolling on normal phone widths.

## J. Product quality gate
Before calling MVP complete:
- [ ] A new activity can be generated from the class page in under 60 seconds without reading documentation.
- [ ] “Surprise Me” creates something genuinely usable from class context alone.
- [ ] Student-facing language is direct and age appropriate.
- [ ] Presentation screen can be understood in roughly five seconds.
- [ ] There are no visible AI clichés, model controls, or prompt-engineering UI.
- [ ] There are no features unrelated to the documented core loop.
