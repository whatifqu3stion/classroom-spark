# Boardwork Project Guidelines

## Product
Boardwork is a teacher tool for creating polished 5–10 minute independent start-of-class activities.

Primary loop:
**Choose class → optionally add today’s context → select reusable chips → Generate / Surprise Me / Start Blank → quick edit → Present.**

The immediate goal is real classroom use. Keep it small, reliable, fast, and visually excellent.

## Requested classroom expansion

The user has explicitly requested saved movable classroom boards and practical classroom widgets. Homebase is authorized alongside the original activity workflow; see `docs/HOMEBASE.md`. The non-goals below still apply outside that requested scope.

## Non-goals
Do not add features unless explicitly requested.

Do not build:
- LMS integrations
- Google Classroom / Newsela integrations
- student accounts or submissions
- multi-teacher account systems
- collaboration/group-work systems
- analytics dashboards
- billing
- native mobile apps
- district/admin systems
- marketplace/community features
- AI chat
- automatic web browsing/news
- drag-and-drop page builders
- QR codes
- multiple AI-provider controls
- themes/template galleries

When tempted to add a feature, ask whether it improves the core loop. If not, do not build it.

## User model
For the immediate MVP, assume **one trusted teacher user**.

Students do not log in. They only view the projected presentation screen.

Do not build full account infrastructure until explicitly requested.

## UX priorities
1. Speed
2. Clarity
3. Projector readability
4. Teacher control
5. Visual polish
6. Feature breadth

A configured teacher should often be able to reach a board in under 20 seconds.

## Visual direction
North star:
**Notion clarity + Linear polish + Raycast efficiency + restrained Apple-like typography/spacing.**

Avoid:
- generic SaaS dashboards
- cliché AI gradients
- purple/blue glowing AI effects
- robot/brain/sparkle imagery
- unnecessary cards
- glassmorphism
- decorative illustration
- over-animation

Use hierarchy through:
- type scale
- weight
- whitespace
- grouping
- restrained color

Use charcoal rather than pure black where appropriate.

## Student presentation
This is the most important screen.

A student should understand within roughly five seconds:
- start now
- what to do
- what materials/mode apply
- how long they have

Use very large responsive typography and generous margins.

Do not shrink type to preserve verbose AI output.

No teacher controls appear in presentation mode.

## Presentation layout
Build **one excellent 16:9 presentation composition** for V1.

Do not build:
- theme galleries
- layout selectors
- presentation templates
- configurable font systems
- decorative background packs

Optimize one layout deeply for classroom projection.

## Technology
Preferred:
- React + TypeScript
- Vite
- Node/Express
- Tailwind CSS
- selective shadcn/ui
- Lucide React
- Zod
- PostgreSQL
- Drizzle ORM

Keep one portable app service, one PostgreSQL database, and a persistent PDF volume.

Do not add a global state library unless needed.

## Coding standards
- TypeScript for application code
- functional React components
- organize feature logic by domain
- share schemas/types where useful
- validate API inputs with Zod
- do not use `dangerouslySetInnerHTML` for AI output
- prefer maintainable code over clever abstractions
- avoid speculative architecture

## Access protection
No custom app password or session cookie is used. BYOK is payment configuration, not authentication.
Use deployment-level sign-in for a private teacher workspace. Do not add multi-user ownership until requested.
Private curriculum endpoints and excerpts remain unavailable unless the host enforces access and the operator explicitly sets `DEPLOYMENT_ACCESS_PROTECTED=true`. That flag does not implement authentication.

## AI
AI calls are server-side only.

Never bundle an owner key. The visitor enters their key in a masked field; keep it in page memory only.

Keep model name configurable with environment variables.

Keep provider-specific logic behind a small adapter.

AI generation now uses request-only BYOK through the direct OpenAI Responses API. The route still injects the provider through the provider-neutral generation interface; `BYOK_MODEL` selects a direct model (default `gpt-5-mini`).

Return structured activity data validated with Zod.

Allow one controlled repair attempt for malformed structured output. Never fabricate fallback activity content after an AI failure.

Every generation request should include canonical class context plus today’s request.

### Device Off
- no browser/device/web task
- notebook/paper + pencil only unless otherwise specified
- independent
- no peer/teacher dependency

### Device On
- only use a teacher-supplied URL
- never invent a URL
- never claim to have inspected/read the URL
- optionally use a teacher-provided short description of what students will find there

Generated output must be concise, age appropriate, student facing, and realistically achievable in 5–10 minutes.

## Start Blank
Start Blank must create the same editable/presentable board without calling AI.

Treat it as a core reliability feature.

## Data
When persistence is added, store:
- classes
- saved chips
- activities
- teacher edits
- favorite state

Use the database, not the published filesystem.

Successful saved activities should survive refresh.

## Secrets and BYOK
AI requests use the visitor's OpenAI key, held only in page memory until refresh. Forward it for the current request only, to the fixed OpenAI endpoint; never persist or log it.
Never fall back to `AI_API_KEY`, `OPENAI_API_KEY`, or `AI_INTEGRATIONS_OPENAI_API_KEY`. Remove/revoke the old owner integration in Replit/provider settings after deployment.
`BYOK_MODEL` optionally selects a direct OpenAI model; default `gpt-5-mini`. `DATABASE_URL` and private storage configuration remain server-only.
Reported token usage is local to this visit and includes repair calls; it is not a bill or account balance. See `docs/BYOK.md`.

## Export
PNG export comes **after** the core classroom loop is stable.

Capture the 16:9 presentation canvas only.

Do not introduce heavyweight rendering infrastructure unless a simple browser approach cannot meet quality needs.

Stage 4 uses a client-side fixed 1920×1080 render of the shared student presentation canvas. Keep presentation controls and teacher-only notes outside the export render, and preserve the live presentation over perfect export fidelity.

## Implementation behavior
Before substantial changes:
1. state briefly what will change
2. check this file and `/docs`
3. preserve MVP constraints

The user’s latest explicit request overrides this file.

When requirements are ambiguous, choose the simplest interpretation that preserves the core product.

Do not redesign unrelated screens while fixing a small issue.

## Completion standard
Use `/docs/TESTING.md`.

Polish matters:
- spacing
- empty/loading/error states
- keyboard focus
- mobile usability
- 1280×720 projector behavior
- 1920×1080 projector behavior

Keep the product calm.
