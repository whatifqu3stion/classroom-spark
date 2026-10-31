---
target: "Boardwork app features: audit and critique"
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
target_identity: "file:/Users/j/Documents/ChatGPT/Boardwork - Spark/artifacts/boardwork/src/pages/workspace.tsx"
target_fingerprint: "sha256:239de5fb6a0221aabf41424385efc534bd1fa8c0fd546c39dd58093c2b87ac96"
target_path: /Users/j/Documents/ChatGPT/Boardwork - Spark/artifacts/boardwork/src/pages/workspace.tsx
timestamp: 2026-10-31T20-53-37Z
slug: artifacts-boardwork-src-pages-workspace-tsx
closed: true
---
Method: dual-agent (A: /root/design_assessment · B: /root/technical_assessment)

# Boardwork feature audit and design critique — October 31, 2026

**Not all features can be signed off as working.** The core is a substantial working prototype, with passing creation, editing, presentation, export, and Homebase regression coverage. There are verified accessibility and mobile usability defects, unresolved browser regressions, and no hosted app. Paid AI generation and production persistence are not live-verified.

Target: `artifacts/boardwork/src/pages/workspace.tsx`, with Home, History, Present, Homebase, curriculum, and landing flows reviewed. Revision `17b92802327fba9561ec92f2ab52d16959deffde`, plus the preceding local landing-link changes. Audit only: no application changes in this run.

## Feature evidence

| Area | Result | Limits |
|---|---|---|
| Frontend components and state | 246/246 tests passed | Unit fixtures |
| Isolated backend contracts | 91/91 passed | Synthetic provider/persistence transports; no paid calls |
| Full Chromium suite | 85 passed, 36 failed, 121 total | Fresh local run on macOS; failures require classification |
| Core workspace | 21/21 browser tests passed | Sample API responses; creation, editing, responsive controls |
| Homebase | 4/4 browser tests passed | Editing, save recovery/conflicts, scope, keyboard layout, timer focus, mobile tools and explicit media loading |
| Presentation | 30/33 main presentation browser cases passed | Includes PNG export, teacher-note exclusion, timer interactions, visuals and responsive checks; sizing regressions remain |
| Images | 4/6 browser cases passed | Failures at 287px overflow |
| Latest committed Docker/database smoke | Passed on GitHub | Exact upstream commit, not a new local DB run or production deployment |
| Live AI, external media providers, production operation | Not verified | No hosted app/database or paid generation used |

CI evidence: https://github.com/whatifqu3stion/classroom-spark/actions/runs/40060477347 — app/database startup, schema migrations, readiness, class/Homebase persistence, revision conflicts and repeat startup passed.

The raw 36 failures are **not 36 broken features**. Twenty-four reading-capacity cases contain outdated Inter expectations or a scroll-size test that treats visible glyph overflow as clipping. The representative 1280×720 recheck showed a prompt with clientHeight 58px and scrollHeight 61px, but visible overflow and no clipping ancestors; the screenshot showed complete text. Two more presentation checks expect old leading (1.19/1.2 versus current 1.18). The desktop rich-text workflow passes in a temporary copy using macOS Meta shortcuts, including persistence, retry, reopen, duplication, presentation and PNG export. The remaining mobile formatting recheck reaches a real Escape-dismissal failure. Original tests were not edited.

Three targeted sequential rechecks confirmed the timer reverse-resize assertion, 390px enlarged-text overflow, and saved-context focus-return failure. Timer font restoration measured 101.112px versus 289.72px at the expected restored divider position; this remains an unresolved resizing regression, not evidence that countdown timing is broken. The saved-context check stops at focus return before completing its longer end-to-end workflow. Backend persistence suites requiring a local PostgreSQL instance were not run successfully here; Docker/PostgreSQL are unavailable. Node is 23.10.0, whereas the project declares Node 24.22.1+, so local results are not a supported-runtime production certification.

Not implemented by design: teacher accounts/data isolation, remote student voting, private Google account imports, live weather/news, billing. The tool catalog contains 21 tool types; this audit did not independently exhaust every state of every tool or validate provider embedding permissions.

## Design and implementation verdict

**Implementation integrity: pass for coherent product intent, with defects.** Warm paper, green-charcoal ink, locally bundled type, classroom-specific activities, distinct student presentation and recovery drafts make this a recognizable teaching product. A visual redesign is not indicated. The biggest opportunity is making reused work as direct to reach as newly created work.

### Technical health: 12/20 — Acceptable, significant work remains

| Dimension | /4 | Evidence |
|---|---:|---|
| Accessibility | 2 | Curriculum keyboard/name gaps; faint favorite icon; focus/loading issues |
| Performance | 2 | Common workspace chunk ~893 kB raw / 259 kB gzip; no runtime slowness benchmark |
| Responsive design | 2 | Baseline 390px screens fit, but enlarged-text/settings and 287px image cases overflow; small targets |
| Theming | 3 | Coherent documented palette; minor text-role drift; no inferred dark-mode defect |
| Implementation integrity | 3 | Product-specific system, with misleading empty state and interaction affordances |

### Design health: 28/40 — Good

| Heuristic | /4 | Key observation |
|---|---:|---|
| Visibility of status | 3 | Strong save feedback; selected saved board initially out of mobile view |
| Match with real world | 3 | Natural teaching language; mobile drag instructions mislead |
| User control and freedom | 3 | Recovery/cancel paths; mobile arrangement limits |
| Consistency and standards | 3 | Coherent visual language; History tabs break expected keys |
| Error prevention | 3 | Defaults, validation, confirmation and revision guards |
| Recognition rather than recall | 2 | Icon-only mobile routes and abbreviated History |
| Flexibility and efficiency | 3 | Templates, reusable context, favorites, presentation |
| Aesthetic and minimalist design | 3 | Restrained UI; setup competes with saved editing |
| Error recovery | 3 | Retry and copy recovery preserve work |
| Help and documentation | 2 | Helpful hints, but incomplete mobile-specific guidance |

## Verified issues

All paths are relative to `/Users/j/Documents/ChatGPT/Boardwork - Spark/`. Grouped totals: **0 P0 / 4 P1 / 7 P2 / 1 P3**. Lack of hosting is a separate release blocker; unresolved timer/test issues are not included as established defects in these counts.

1. **[P1] Existing curriculum sources cannot be opened with a keyboard.** `src/components/curriculum/curriculum-manager.tsx:88` renders a click-only li with no focusable action. This blocks keyboard users from reviewing sources (WCAG 2.1.1). Use a real button. Source verified; curriculum fixture not browser exercised. `$impeccable harden`.
2. **[P1] Curriculum objective controls lack accessible names.** `src/components/curriculum/curriculum-source-dialog.tsx:197` and `:208` render repeated checkbox/textarea controls without associated labels. Screen-reader users cannot reliably distinguish objectives (WCAG 4.1.2 / 3.3.2). Add stable labels/IDs. Source verified. `$impeccable harden`.
3. **[P1] Favorite stars are too faint.** `src/pages/history.tsx:357` uses a 30%-opacity muted outline. Computed color over the paper row gives approximately 1.62:1 versus the 3:1 non-text target (WCAG 1.4.11). Use a full-contrast outline and fill to convey selected state. Browser verified. `$impeccable harden`.
4. **[P1] Saved boards reopen below the setup form on phones.** `src/pages/home.tsx:811` places generator controls ahead of the editor. At 390×844 the editor starts at y=1122; neither saved content nor Present is initially visible. Opening a saved item looks like starting again. Put the editor first on existing-activity routes and collapse setup. `$impeccable adapt`.
5. **[P2] Responsive overflow and small targets persist.** Presentation settings expand to 396px at a 390px viewport with enlarged root text; at 287px they remain 396px wide. Image cases also overflow at 287px. Relevant components: `src/components/presentation-theme-picker.tsx:135`, `presentation-image-editor.tsx:121`, `board-editor.tsx:408`. Help buttons are 20px wide, and native Homebase selects remain 32–40px high; coarse-pointer sizing does not cover every width/select. Fix constraints and touch hit areas. Sub-44px alone is not a blanket WCAG AA failure. `$impeccable adapt`.
6. **[P2] Keyboard models and focus recovery are inconsistent.** History tabs at `src/pages/history.tsx:178` do not respond to arrows. Rich-text Escape at `src/components/inline-editor/inline-editor.tsx:331` returns editor focus but leaves the toolbar visible in the corrected Mac test. The saved-context dialog's Escape path fails its return-to-trigger check (`src/pages/saved-context.e2e.spec.ts:334`). Use accessible tabs or pressed filters; harden focus and dismissal. `$impeccable harden`.
7. **[P2] Mobile reuse relies on memory.** `src/pages/history.tsx:372` truncates useful task text to a fragment while metadata keeps width. `src/components/layout/shell.tsx:50` and following links hide all visible route labels below sm. Use two-line task previews and visible short route labels. Accessible route names exist; this is not a missing screen-reader label allegation. `$impeccable layout`, `$impeccable clarify`.
8. **[P2] Mobile Homebase advertises an inactive drag action.** `src/features/homebase/board.tsx:352` says to drag while `:599` disables pointer movement at ≤700px and grips remain visible. Native/mobile geometry confirmed a drag leaves the tool unmoved. Show mobile-specific arrangement controls/instructions. `$impeccable adapt`.
9. **[P2] Empty Favorites incorrectly claims no activities exist.** `src/pages/history.tsx:318`: All (1), Favorites (0) renders “No activities yet” instead of explaining how to star existing activities. Branch on the selected view and offer Show all activities. Browser verified. `$impeccable clarify`.
10. **[P2] Initial API loading has no usable text status.** `src/store/boardwork-context.tsx:144` is an unlabeled spinning SVG; blanket reduced-motion handling at `src/index.css:312` leaves it static. Add visible status text with role=status and a decorative icon. Source verified, not a slow-network browser simulation. `$impeccable harden`.
11. **[P2] Route entry loads unnecessary code.** `src/pages/workspace.tsx:3` synchronously imports Home, History and Present; `src/pages/present.tsx:7` imports PNG export up front. History therefore pays for editor/presentation code. Lazy-load routes/export after profiling; existing Homebase lazy loading is good. Current public-build chunks: index ~529 kB raw/171 kB gzip, workspace ~893/259 kB. No Core Web Vitals claim. `$impeccable optimize`.
12. **[P3] Small text roles drift.** History eyebrow (`src/pages/history.tsx:376`) and curriculum guidance use 10px; Homebase timer status can fall below its documented 12px caption. Restore documented roles without altering presentation fitting. `$impeccable typeset`, then `$impeccable polish`.

The `src/` shorthand in this list refers to `artifacts/boardwork/src/`.

## Experience critique

The student presentation is the strongest moment: clear task hierarchy, distinct teacher controls, useful timer and legible projected content. Desktop creation feels calm and purpose-built. The weak point is returning to saved work on a phone: identify a truncated item, open it, then scroll through setup again.

Cognitive load is moderate (3/8 checklist concerns): competing creation/editing focus, recall-heavy mobile navigation/history, and the large tool catalog. Grouping/search and progressive disclosure help; these concerns do not justify hiding useful classroom tools wholesale.

Jordan (first-timer) struggles to distinguish Workspace/Homebase icons and why saved work opens on setup. Sam (keyboard/screen-reader user) encounters curriculum blockers, unnamed objective fields and incomplete tab/focus behavior. Casey (interrupted mobile teacher) must scroll to saved work and encounters misleading drag instructions. Actual VoiceOver, physical touch hardware, and comprehensive zoom were not tested.

Maintain the existing visual identity and recovery model. In native browser testing, a synthetic failed Homebase save retained edited text and offered Retry save / Save draft as a copy; copying produced a saved new board with content intact. The 4 Homebase browser regressions also passed, including revision-conflict handling. Those are meaningful strengths.

## Detector reconciliation

One CLI scan returned 29 advisories: 15 color, 13 font-size, 1 radius. All 15 color hits are test fixtures; the 2px inline-highlight radius is not a panel/control radius. Several size hits are unused infrastructure or valid fluid display sizes. Verified text-role drift is retained above; the findings do not call for replacing the palette or eliminating authored highlights. Full output: `/tmp/boardwork-audit-b/detector.json`.

## Evidence and limits

- Browser suite: `/tmp/boardwork-audit-e2e-clean.json`; targeted confirmations `/tmp/boardwork-audit-confirm.json`; macOS formatting recheck `/tmp/boardwork-audit-rechecks.log`.
- Unit/API logs: `/tmp/boardwork-audit-ui-tests.log`, `/tmp/boardwork-audit-api-isolated.log`, `/tmp/boardwork-audit-api-boundary.log`.
- Design evidence: `/tmp/boardwork-audit-a/interaction-evidence.json`, `workspace-mobile-top.png`, `workspace-mobile-editor-viewport.png`, `history-mobile.png`, `homebase-mobile.png`.
- Presentation geometry and screenshot: `/tmp/boardwork-audit-geometry.log`, `/tmp/boardwork-presentation-audit-1280.png`, `/tmp/boardwork-presentation-audit-390.png`.
- No paid AI, real teacher data, deployments, or application edits. Test-generated tracked screenshot evidence was restored to its pre-audit content, with generated copies retained in /tmp.

## Decisions for the next pass

Should work start with accessibility and interaction defects, the mobile reuse flow, or hosting/live verification? Should the fix scope cover the four P1 issues first, all verified issues, or technical/test reliability only? These are choices for a subsequent implementation turn, not authorization to change the app during this audit.
