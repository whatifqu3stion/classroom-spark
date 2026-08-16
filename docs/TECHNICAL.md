# Boardwork — Technical & Data Specification

## Technical philosophy
Optimize for:
- fastest reliable Replit build
- one codebase
- simple deployment
- easy Agent maintenance
- minimal infrastructure
- clean future migration path

Do not introduce services merely because they are fashionable.

## Recommended stack

### Application
- React
- TypeScript
- Vite
- React Router
- Node.js + Express API in the same Replit project

### UI
- Tailwind CSS
- selective shadcn/ui primitives
- Lucide React
- React Hook Form only where it clearly helps
- Zod

Do not construct every surface as a Card.

### Data
Add after the Stage 1 UX is accepted:
- Replit PostgreSQL
- Drizzle ORM
- checked-in migrations

### Access protection
For the immediate single-user MVP, do not build full authentication/account infrastructure.

Preferred:
1. Replit deployment privacy/password protection, if available on the active plan
2. otherwise a simple server-side password backed by `APP_PASSWORD` in Replit Secrets

Full user accounts and per-user ownership are a later productization step.

### AI
Add after the UX/persistence stages:
- server-only provider adapter
- model configured by environment variable
- structured JSON response
- Zod validation

### Export
Add after the classroom loop is stable.

Prefer a straightforward client-side DOM-to-image approach for PNG export.

Do not add a server-side headless browser solely for export unless necessary.

## Why this stack
Boardwork is a modest CRUD + generation application.

Explicit client/server boundaries are easy to reason about and debug in Replit.

If Agent prefers an equivalent supported full-stack architecture, it may adjust only if it preserves:
- TypeScript
- server-only secrets
- PostgreSQL persistence
- responsive React UI
- documented behavior
- one deployable project

## Suggested structure
```text
/
  client/
    src/
      components/
      pages/
      features/
        classes/
        generator/
        activities/
        presentation/
      lib/
  server/
    routes/
    services/
      ai/
    db/
    middleware/
  shared/
    schemas/
    types/
  docs/
  replit.md
```

Exact generated structure may differ.

## Environment variables
At minimum when real AI is connected:
- `AI_API_KEY`
- `AI_MODEL`

Optional fallback access protection:
- `APP_PASSWORD`

Never expose secrets to client code.

## Data model

### classes
- id UUID
- name
- grade_level
- subject
- course_context nullable
- current_unit nullable
- default_device_mode (`off` | `on`)
- default_duration_minutes (5 | 7 | 10)
- arrival_instructions nullable
- ai_guidance nullable
- created_at
- updated_at

### chips
- id UUID
- class_id
- label
- sort_order
- created_at

### activities
- id UUID
- class_id
- eyebrow nullable
- title
- task
- prompts JSON/JSONB
- duration_minutes
- device_mode
- materials JSON/JSONB nullable
- resource_url nullable
- resource_note nullable
- teacher_note nullable
- activity_style nullable
- source_topic nullable
- source_goal nullable
- source_chips JSON/JSONB nullable
- is_favorite boolean
- created_at
- updated_at
- duplicated_from_activity_id nullable

No user table is required for the single-user MVP.

No need to store raw system prompts in the database.

## Suggested API
Exact routes can vary.

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/:id`
- `PATCH /api/classes/:id`
- `DELETE /api/classes/:id`

- `POST /api/classes/:id/chips`
- `PATCH /api/chips/:id`
- `DELETE /api/chips/:id`

- `POST /api/generate`

- `GET /api/activities`
- `GET /api/activities/:id`
- `POST /api/activities`
- `PATCH /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/activities/:id/duplicate`

Validate all inputs server-side.

## Generation request
Example:
```json
{
  "classId": "uuid",
  "topic": "osmosis and diffusion",
  "goal": "practice scientific reasoning",
  "chipIds": ["uuid", "uuid"],
  "deviceMode": "off",
  "durationMinutes": 7,
  "activityStyle": "Curiosity Hook",
  "teacherProvidedUrl": null,
  "teacherProvidedResourceNote": null
}
```

The server should fetch canonical class/chip data itself.

## Start Blank
Start Blank should not call `/api/generate`.

It creates a local/new activity draft using:
- class defaults
- empty title/task/prompts
- default duration
- arrival instructions where appropriate

After persistence is added, save it like any other activity.

## Save behavior
Once persistence exists:
1. successful generation creates a saved activity
2. Start Blank can create a saved draft on first meaningful edit/present
3. edits autosave with a short debounce
4. show a subtle saved state

Favor reliability over clever state handling.

## Presentation
Use a dedicated route such as:
`/present/:activityId`

Build one 16:9 composition.

Include:
- fullscreen action
- no teacher chrome
- responsive type
- generous safe margins

Do not rely on transient in-memory state once persistence exists.

## PNG export
Implement only after the core classroom workflow is stable.

Capture the presentation canvas only.

Target 16:9, ideally 1920×1080 or equivalent high-density output.

## Error handling
Handle:
- network failure
- AI timeout/failure
- invalid structured response
- database errors
- missing class/activity
- access-gate failure

Rules:
- preserve teacher input
- use plain-language errors
- provide Retry when appropriate
- log technical errors server-side
- never display secrets or raw stack traces

## Security
- secrets only in environment variables
- access protection outside client-only state
- Zod validation for request bodies
- no arbitrary HTML from AI
- no `dangerouslySetInnerHTML` for generated content
- validate teacher-provided URLs
- prevent duplicate generation requests
- do not log API keys/passwords

## Performance
Prioritize:
- fast initial load
- quick class switching
- no unnecessary global state framework
- stable generation UI
- no duplicate overlapping requests

## Testing priority

### Stage 1 manual QA
- mobile teacher workflow
- 1280×720 presentation
- 1920×1080 presentation
- Start Blank
- editing
- mocked generation

### Stage 2+
Automate critical logic:
- schema validation
- Device Off generation contract
- generation route error handling
- persistence behavior

Then manually test:
- refresh/recovery
- history/reuse
- PNG output

## Future-friendly, not future-built
The data model should not make later multi-user productization impossible, but do not implement account abstractions now.

Future possibilities may include:
- teacher accounts
- shared libraries
- integrations
- native clients

None belongs in the immediate MVP.
