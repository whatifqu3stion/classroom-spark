---
target: Boardwork newer teacher features
total_score: 29
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: "file:/Users/j/Documents/ChatGPT/Boardwork - Spark/artifacts/boardwork/src/pages/homebase.tsx"
target_fingerprint: "sha256:39f027d7e7b37f16309634a55be06fa40dbbf8458de31cac1231934b80017864"
target_path: /Users/j/Documents/ChatGPT/Boardwork - Spark/artifacts/boardwork/src/pages/homebase.tsx
timestamp: 2026-11-14T20-46-31Z
slug: artifacts-boardwork-src-pages-homebase-tsx
---
# Boardwork newer-feature review · November 14, 2026

The review covered all 21 Homebase tools, board management and presentation, saved teaching guidance, curriculum, and optional AI drafting. The reference screens were the published product tour and the existing teacher workspace. Two independent reviews examined the interaction design and technical behavior. The initial design critique scored 29/40. The follow-up below records checks against the revised local production build.

| Workflow | Finding and change | Follow-up |
| --- | --- | --- |
| Board management | Searching could contradict the activity results. Untitled activities were indistinguishable. A phone reorder flattened desktop columns. Search now includes task text and tool groups. Mobile moves retain sizes and keep adjacent tools on the same row when they fit. | Good. Searching by task, recovering from no matches, saving, reopening, and moving a timer between two differently sized tools passed. |
| Teach | Arrival boards contained editing instructions. New boards open with a student prompt and three agenda steps. Empty tools offer setup actions in editing mode. Completed steps use a checkmark. | Good. Checked the saved activity, note editing, agenda toggle and drawing controls. |
| Time | The stopwatch offered Start after a pause. A countdown showed 0 on the day itself. Controls now say Resume and Today, and the monthly calendar identifies today's date programmatically. | Good. Checked all five time tools, including starting a timer, focusing it, and returning to the same running timer. |
| Participation | Teachers had to type the same roster twice. A new picker or group maker can copy an existing on-board name list. Shuffle again distinguishes a second draw, and group headings sit beside a quiet divider. Counters disable actions at their limits. | Good. Checked name selection, roster reuse, grouping, dice, scoring and a show-of-hands vote. |
| Classroom routines | The traffic signal already paired color with a word. The three signals now form a named group. | Good. Changed the signal and work mode, then checked the visible and programmatic selection. |
| Resources | Try again returned to the load prompt after an image failed. The button now retries immediately. Unembeddable video, document and PDF links explain the new-tab behavior in the editor. | Good. Checked the ordinary link, an image failure and successful second request, and consent-before-load for video, PDF and embed. External providers were simulated or left unloaded. |
| Saved teaching guidance | The primary exit was an X and short screens left little space for the footer. The scrollable list now ends above a footer with the selection count and Done. Invalid labels receive focus and an associated message. | Good. Checked selection, search, editing, recovery and the footer at 667 × 375. Existing tests also cover two widths, light and dark themes and mixed-direction text. |
| Curriculum | Metadata and maintenance actions competed with reviewing the goals. Review now leads with the summary and goals. Source details and maintenance actions sit in a disclosure. A failed detail request offers Retry. Text, PDF and Discover respect the workspace's reported capabilities. | Good. Checked keyboard objective review, import availability, source replacement and cache updates using fixtures. |
| Optional AI | Create board obscured that the action used AI. The primary action now says Draft with AI beside Start blank. Empty usage figures are hidden until a key is set. Invalid input receives focus, and closing settings restores focus to the initiating action. | Good. Verified return to each of the header, usage and draft controls. No paid requests were made. |

The visual pass retained Bitter headings, dark green ink, opaque paper surfaces, and the established butter, sage and lavender tool colors. The detector's only advisory on changed interface files concerned the 4rem mobile numeric readout, an existing projection size explicitly documented in DESIGN.md. No detector rule was suppressed.

The frontend typecheck, production build and 249 unit tests passed. All 34 focused browser cases passed against the production build across the suite and one isolated rerun of a timed-out desktop saved-guidance check. Additional browser checks covered each tool type, resource retry, compact layout after reordering, roster copying, short viewports and keyboard focus. These results cover the local UI and simulated API responses. Live database persistence, real external embed availability, paid AI responses, and hardware screen reader behavior were outside the verification.
