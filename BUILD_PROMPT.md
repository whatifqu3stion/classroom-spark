# Initial Replit Agent Build Prompt

Build **Boardwork**, a polished single-user classroom MVP for teachers to create excellent 5–10 minute independent start-of-class activities (“Do Nows,” bell-ringers, entry tasks).

Before coding, read this prompt, the root `replit.md`, and the supporting files in `/docs`.

## Core product loop
**Choose class → optionally add today’s context → select reusable chips → Generate / Surprise Me / Start Blank → quick edit → Present.**

The app should feel fast enough to use a few minutes before students enter.

## Do not overbuild
Do **not** add:
- LMS / Google Classroom / Newsela integrations
- student accounts or submissions
- multi-teacher accounts
- billing
- analytics dashboards
- native mobile apps
- automatic web browsing/news
- AI chat
- community/marketplace features
- QR codes
- drag-and-drop layout builders
- presentation themes or template galleries

Do not invent features simply to make the app look more complete.

## Required functionality

### 1. Single-user access protection
This first version is for one teacher.

Do not build user accounts, invitations, profiles, or per-user ownership.

Preferred:
- use Replit deployment privacy/password protection if available on the active plan;
- otherwise implement one simple **server-side** app password using an `APP_PASSWORD` value stored in Replit Secrets.

Never rely on a client-only password check.

### 2. Classes
Teacher can create/edit/delete classes.

Fields:
- name
- grade / age level
- subject / course
- course context
- current unit
- default Device Off / Device On
- default duration: 5, 7, or 10 minutes
- persistent arrival instructions
- optional AI guidance

Class context persists and is automatically used for generation.

### 3. Saved chips
Each class can have compact reusable chips such as:
- retrieval practice
- sketch
- evaluate
- scientific reasoning
- curiosity hook
- vocabulary
- reflect

Teacher can add, edit, delete, and select multiple chips quickly.

### 4. Generator
Show:
- current topic/context input
- optional practice/goal input
- saved chips
- Device Off / Device On segmented control
- duration
- optional activity style
- Generate
- Surprise Me
- Start Blank

Do not make this feel like a long form.

### 5. Start Blank
Start Blank is a core feature.

It must create the same editable/presentable board **without making any AI request**.

Open a clean draft with empty/default content and useful class defaults such as duration or arrival instructions.

This keeps Boardwork useful when the teacher already knows the task or when the AI service is unavailable.

### 6. AI generation
AI requests happen on the server only.

Use a small provider adapter and environment variables:
- `AI_API_KEY`
- `AI_MODEL`

Return structured data and validate it with Zod.

Generate **one** student-facing independent activity that:
- fits 5 / 7 / 10 minutes;
- matches the stored grade/age;
- is concise enough to project;
- is intellectually worthwhile, not filler;
- can be started without teacher explanation;
- requires no peer interaction;
- respects Device Off / Device On.

**Device Off**
- no browser/device use
- assume notebook/paper + pencil unless context says otherwise

**Device On**
- may use only a teacher-supplied URL
- never invent a URL
- never pretend to have inspected/read a URL
- include an optional field: **“What will students find there?”**
- AI may use only the teacher-provided resource description unless actual resource contents are explicitly provided

Use `/docs/AI_GENERATION.md` for detailed generation rules.

### 7. Editing
Generated or blank activity appears as a polished board preview.

Teacher can directly edit:
- eyebrow/label
- title
- task
- up to 3 prompts
- duration
- arrival instruction/footer

Use simple structured editable fields, not a heavy rich-text editor.

### 8. Presentation
Create one dedicated presentation route/view.

This is the most important visual screen.

Build **exactly one excellent 16:9 presentation composition** for V1.

Do not build themes, template galleries, layout selectors, or teacher-customizable visual systems.

Requirements:
- fills viewport
- no teacher navigation/edit controls
- extremely strong typography and whitespace
- readable at 1280×720 and 1920×1080
- comprehensible by students in roughly five seconds
- arrival instructions visually secondary
- fullscreen action
- responsive typography using CSS such as `clamp()`

It should feel like a beautifully designed slide, not a web dashboard.

### 9. Persistence and history
After the classroom workflow is approved, persist:
- classes
- chips
- activities
- teacher edits
- favorite state

History actions:
- open
- present
- duplicate/remix
- favorite
- delete

### 10. PNG export
PNG export is useful but **must not delay the classroom loop**.

After the class → board → present workflow is stable, export only the 16:9 presentation canvas as a crisp PNG suitable for Google Slides.

Prefer a straightforward client-side DOM-to-image approach.

## Visual design
North star:
**Notion clarity + Linear polish + Raycast efficiency + restrained Apple-like typography/spacing.**

Do not copy those products.

Use:
- Inter or Geist Sans
- strong typographic hierarchy
- generous whitespace
- warm/soft neutrals
- charcoal rather than harsh pure black where appropriate
- one restrained accent
- subtle dividers/shadows only when useful
- Lucide icons
- selective shadcn/ui primitives
- Tailwind CSS

Avoid:
- cliché purple/blue AI gradients
- robot/brain/sparkle imagery
- generic AI visual language
- CRM/SaaS dashboard layouts
- nested cards everywhere
- glassmorphism
- decorative illustration
- excessive animation

The app should not visually announce “AI.”

## Preferred stack
Use:
- React + TypeScript
- Vite
- Node.js / Express
- React Router
- Tailwind CSS
- shadcn/ui selectively
- Lucide React
- Zod
- Replit PostgreSQL
- Drizzle ORM

One Replit project, one deployment.

If current Replit constraints strongly favor an equivalent supported full-stack structure, you may adjust the framework architecture, but preserve:
- TypeScript
- server-only secrets
- PostgreSQL persistence
- responsive React UI
- documented behavior
- one deployable project

## Security
- AI keys server-side only
- secrets in Replit Secrets / environment variables
- access protection outside the client
- Zod validation on API inputs and AI outputs
- never render arbitrary HTML from AI
- validate teacher-supplied URLs
- prevent duplicate overlapping generation requests
- friendly user errors; technical details logged server-side
- never expose secrets or raw stack traces

## Build strategy

### Stage 1 — Prove the classroom experience
Build only:
1. app shell and visual system
2. class setup/workspace UI
3. chips
4. generator controls
5. Start Blank
6. mocked activity generation
7. inline editing
8. one 16:9 presentation view
9. responsive teacher controls

Use a small hard-coded/mock generation response.

**Stop after Stage 1.**

Do not add real AI, database persistence/history, or PNG export yet.

Report:
- what works
- screenshots/previewable states if available
- relevant acceptance tests
- the smallest manual classroom-flow tests to try next

### Stage 2 — Persistence
After Stage 1 is accepted:
1. add Replit PostgreSQL + Drizzle
2. persist classes/chips/activities
3. autosave edits
4. add history/reuse/remix

### Stage 3 — Real AI
After the workflow is stable:
1. add the server-side provider adapter
2. structured generation + Zod validation
3. retries/errors
4. Device Off/On enforcement

### Stage 4 — Export + final QA
1. PNG export
2. projector testing
3. responsive/accessibility QA
4. acceptance-test cleanup

Then stop. Do not invent additional product features.
