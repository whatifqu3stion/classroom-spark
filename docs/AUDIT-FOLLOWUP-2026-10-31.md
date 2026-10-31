# Boardwork audit follow-up — October 31, 2026

The twelve grouped application findings from the Impeccable audit are addressed locally. This is not a production deployment or a claim that live AI and database services have been verified.

| Finding | Resolution |
| --- | --- |
| Curriculum keyboard access | Sources open through native buttons with visible keyboard focus. |
| Objective names | Every checkbox and editable objective has a distinct accessible name; excerpts describe the wording fields. |
| Favorite contrast | Full-strength muted outlines and filled ink stars distinguish the two states. |
| Saved boards on phones | Existing-activity routes open directly in the editor; Create another board returns to setup. Desktop retains both panes. |
| Responsive settings and touch targets | Expandable settings use a constrained grid column; images/settings fit at 287px and with enlarged text. Help/icon controls and Homebase selects receive touch sizing. |
| Keyboard and focus | History uses pressed filter buttons. Formatting captures the latest native selection before toolbar focus, and Escape dismisses it synchronously. Context dialogs retain focus correctly and cannot close during a save/archive. |
| Mobile recognition | Navigation labels remain visible; History displays two-line task previews with readable metadata. |
| Homebase arrangement | Mobile hides inactive drag grips and provides persistent Move up/down menu actions. Reordering packs tools into non-overlapping rows; desktop dragging remains available. |
| Empty Favorites | Explains starring activities and offers Show all activities. |
| Loading and reduced motion | Initial loading has visible status text and a decorative icon. Reduced motion removes spinner/entrance animations and uses immediate transitions. |
| Route loading | Home, History, Present and Homebase load independently. PNG conversion loads when exporting. |
| Text roles | Curriculum, History, saved-context captions and Homebase timer status use readable caption sizes; form guidance/errors use the standard small text role. |

## Verification

- 247 frontend unit tests passed on Node 24.22.1; the subsequent selection-race fix passed all 10 inline-editor tests, including one new regression (248 current tests in total).
- All 125 Chromium scenarios verified across the full run and targeted reruns: 117 passed in the full run, seven failed cases passed after test corrections, and the remaining formatting case passed after the selection-race fix. Both desktop and mobile formatting workflows passed together afterward.
- Repository typecheck passed; the final inline-editor change also passed the frontend typecheck.
- Production build verified on Node 24.22.1. The shared workspace entry is about 29 kB raw / 9 kB gzip, compared with about 893 / 259 kB previously. The common initial index remains about 529 / 171 kB; this is route splitting, not elimination of all editor code or a measured Web Vitals improvement.
- Desktop/mobile screenshots reviewed, with a confirmation pass for mobile arrangement. Browser cases cover 287px widths, enlarged text, dark appearance, keyboard interaction, image editing, saving/recovery, presentation, and PNG export.

The timer resize failure was a premature container-query measurement combined with a test that assumed the same reset ratio for image and timer-only layouts. The corrected check waits for the original numeral size to return and verifies each layout's actual divider bounds. Countdown behavior was unchanged.

Other test repairs use platform-correct keyboard shortcuts, the documented Bitter face and 1.18 task leading, and actual glyph bounds against clipping ancestors. Generated reading-capacity evidence now goes to the test output directory. Fixture paths work when the repository path contains spaces. The dark-color test disables motion before inspecting colors.

The final Impeccable scan was reconciled manually. Remaining advisories include test colors, deliberately authored presentation themes and fallback colors, mathematical font fallbacks, documented Inter/Open Sans, fixed export geometry, and small highlight radii. The bounce hit points to a reduced-motion suppression rule, not an added animation. No palette/font redesign or unrelated design-metadata migration was performed.

## Remaining release work

The app still needs a selected hosting environment with its PostgreSQL database and persistent PDF storage. The existing Docker setup is documented in [STANDALONE.md](STANDALONE.md). The public landing page must be configured with the real hosted workspace URL. No hosting resources were provisioned, no changes were pushed or published, and no paid AI requests were made. Production persistence, private-access configuration and live provider behavior require verification on that host.

Local evidence: `/tmp/boardwork-fix-final.log`, `/tmp/boardwork-fix-recheck.log`, `/tmp/boardwork-fix-formatting.log`, `/tmp/boardwork-fix-node24-units.log`, `/tmp/boardwork-fix-selection-unit.log`, `/tmp/boardwork-fix-full-typecheck.log`, `/tmp/boardwork-fix-build-final.log`, and `/tmp/boardwork-fix-visuals/`.

## Feature-wide adaptation and refinement

The teacher interface now carries the front page’s classroom-first language through activity setup, class/unit profiles, saved context, curriculum, History, AI settings and Homebase. Shared dialogs and drawers use the established Bitter heading role, opaque paper surfaces, left-aligned guidance and larger touch targets. Error and missing-page recovery use the same visual language. Empty states describe the next useful action; Homebase tools are grouped by classroom need. AI settings explain optional drafting and how the key is handled.

The responsive inspection found and corrected crowded curriculum import tabs at 320px and a blank Homebase option for untitled saved activities. Source controls wrap on narrow screens. The student presentation’s typography, geometry and fit behavior were preserved.

Verification on Node 24 / Chromium:

- All 248 unit scenarios verified across the full run and focused rerun: 244 initially passed; four old-copy expectations were updated, then all 39 Home tests passed.
- All 125 browser scenarios verified across the full run and focused rerun: 121 initially passed; three old-copy assertions were updated, and one presentation probe-timing check passed in the serial rerun. The focused rerun passed five scenarios, including enlarged-text containment. The timing failure is recorded rather than represented as a clean first run.
- Frontend typecheck, production build and `git diff --check` passed. Vite still reports existing chunks above 500 kB; this refinement does not address bundle size.
- Captured 36 views across 1280px, 820px, 390px and 320px widths. Reviewed representative desktop, tablet and mobile surfaces, then confirmed the final narrow-screen fixes in nine additional views with no page errors. Import tabs fit and have 44px targets; untitled saved activities have a visible label.
- Evidence: `/tmp/boardwork-refine-units.log`, `/tmp/boardwork-refine-unit-rerun.log`, `/tmp/boardwork-refine-e2e.log`, `/tmp/boardwork-refine-rerun.log`, `/tmp/boardwork-refine-build.log`, `/tmp/boardwork-refine-visuals/`, and `/tmp/boardwork-refine-confirm/`.

These checks use local mocked API fixtures. Live AI, production persistence and hosting remain outside this verification; no deployment was made. Mobile sizes were checked in Chromium emulation, not on physical devices or Safari. Build and screenshot outputs were written under `/tmp` to avoid the previously blocked protected-folder outputs.
