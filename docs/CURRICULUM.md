# Curriculum sources and varied boards

Curriculum setup is optional. Existing class details, unit standards, Saved Context, and Start blank continue to work without importing anything.

## Setup and review

Class settings offer teacher text, text-based PDF upload, and teacher-initiated official-source discovery. A source belongs to one class, optionally narrowed to a reusable unit. Programme year/band is independent of grade and academic year; Boardwork never guesses it.

Imported material starts as a draft. Supporting excerpts and page/section references are preserved separately from editable summaries and objective interpretations. Teachers select the relevant objectives, correct applicability, and approve. Later edits require reapproval; deactivation immediately removes a source from future planning. Replacing a document is an explicit new draft, not a silent update to earlier boards.

Approval means “use this as my class context,” not proof that a document is official or that an activity meets an assessment criterion. Manually supplied content and uploads remain teacher-provided. Discovery labels rely on the actual public publisher domain, not a model's assertion.

## Discovery

Search runs on the server through the existing OpenAI Responses integration with its runtime web-search tool. Queries contain only framework, subject and programme year—not uploaded text, class notes, student information or class names. Public International Baccalaureate material is the initial supported authority for MYP; this is not a worldwide standards catalogue.

Search results are pointers. The server independently retrieves eligible documents with protocol, host, redirect, time and size restrictions. Search snippets are never substituted for a complete retrieved source. If detailed year objectives are not publicly accessible, use teacher text or a readable PDF; the app does not bypass access controls or present generic model knowledge as official curriculum.

Discovery is teacher-initiated and cached. Refreshing a web source produces a draft requiring review. Board generation never browses.

## PDFs and access

PDF bytes live in private App Storage, not database records or presentation-image routes. The database keeps bounded text/page metadata and a private storage reference. File downloads resolve a source ID within its class; clients cannot submit arbitrary storage paths.

The existing signed-session `APP_PASSWORD` gate must be configured before curriculum operations are enabled. Without it, the library reports a setup requirement rather than exposing private material. No account or authentication migration is introduced.

The first version supports text PDFs and ordinary table text with page attribution. Image-only, encrypted, corrupt, over-limit or materially incomplete documents fail with a recovery message. Paste the relevant text or upload a smaller readable section; OCR is not included. Processing is bounded and synchronous, so a reload cannot leave an endless pending job.

Deletion removes private uploaded bytes and future eligibility. If cleanup fails, deletion remains retryable and the source cannot be used for generation. Delete sources before deleting their class or reusable unit, preventing orphaned documents or unintended scope changes.

## Generation and history

Today's instructions and hard duration/technology controls take precedence over Saved Context, then selected-unit and class context. Only approved sources matching the class's subject, framework and programme year are candidates, and selected-unit sources take priority over class-wide sources. Unmatched explicit requests do not acquire a misleading source citation.

For blank-topic generation, the planner chooses an eligible objective, thinking task, response mode and concrete example context. It considers at most 20 recent boards and prioritizes underused combinations. The generator must make the chosen objective shape the actual student task, adapt it to the class, and avoid merely swapping nouns in a repeated template. Validation and duplicate repair share a maximum of two model attempts; a failed generation is not saved.

Each generated board stores a bounded immutable basis: source version, objective, supporting excerpt/location and chosen focus metadata. The collapsed teacher-only **Based on** disclosure uses this snapshot, not the current source record. History, duplication and historical remix retain that basis; source edits and deletion cannot retroactively rewrite it. No source metadata is rendered in Present or PNG output. Start blank performs no AI or discovery call.

## Verification boundaries

Provider, storage and browser tests use isolated fixtures or intercepted requests rather than changing teacher records. Runtime web search was checked separately with one bounded public MYP Design query. A private synthetic PDF passed a live upload/read/delete round trip, and one live generation from synthetic teacher-provided MYP Design context produced a concise user-needs activity.

The public IB document returned by search rejected server retrieval with an access challenge during verification. The importer reported the access problem and offered text/PDF alternatives; it did not bypass the challenge. Official-source extraction was therefore checked with fixtures, not claimed as a successful live end-to-end import. Passing fixtures alone is not evidence of live publisher availability.