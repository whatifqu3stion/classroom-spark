# Boardwork — Replit Agent Build Stages

Use this document to keep Agent focused.

## Stage 1 — Prove the classroom experience
Goal: determine whether Boardwork feels great to use before adding infrastructure.

Build:
- polished app shell
- class setup screen
- class workspace
- chips
- Device Off / Device On
- 5 / 7 / 10 min
- topic/context + goal
- Generate
- Surprise Me
- Start Blank
- mocked activity result
- inline editing
- one excellent 16:9 presentation screen
- responsive teacher controls

Do not build yet:
- real AI
- database
- history
- PNG export
- user accounts

Questions Stage 1 must answer:
- Can a teacher understand the workflow immediately?
- Is there too much typing?
- Does the generated-board editor feel fast?
- Is the presentation visibly excellent at classroom distance?
- Does Start Blank make the app useful even without AI?

## Stage 2 — Make it durable
Add:
- Replit PostgreSQL
- Drizzle
- class persistence
- chip persistence
- activity persistence
- autosave
- history
- duplicate/remix/favorite/delete

Do not redesign Stage 1 unless testing revealed a problem.

## Stage 3 — Add intelligence
Implemented:
- server-side AI adapter
- model/config environment variables
- structured output
- Zod validation
- error/retry behavior
- Device Off/On enforcement
- teacher-provided Device On URL + resource note
- validated-generation persistence through the Stage 2 activity flow
- materials and teacher-only notes
- lightweight recent title/style summaries for variety

Initial provider: OpenAI through Replit AI Integrations, configured with `AI_MODEL=gpt-5.6-luna`.

Keep AI invisible in the visual design.

## Stage 4 — Convenience and QA
Add:
- PNG export
- final responsive checks
- accessibility checks
- projector tests
- acceptance-test cleanup

Then stop.

Do not add integrations or new feature categories before classroom use produces evidence that they are needed.
