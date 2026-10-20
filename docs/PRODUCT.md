# Boardwork — MVP Product Specification

## 1. Problem
Teachers need the opening minutes of class to take attendance, greet students, transition materials, and establish focus. Students need a predictable routine that lets them begin meaningful work independently without waiting for teacher instructions.

Creating a fresh, worthwhile “Do Now,” bell-ringer, warm-up, board work, or entry task every day creates unnecessary planning friction.

Boardwork reduces that friction.

## 2. Target user
Primary user: classroom teachers teaching approximately grades 4–12.

The MVP should work especially well for middle-school contexts while remaining flexible enough for other age groups.

Students are **viewers of the generated board**, not app users.

## 3. Jobs to be done
When I am preparing for class, I want to generate a worthwhile 5–10 minute independent entry activity quickly so students can begin immediately and I can handle the opening logistics of class.

When I am rushed between classes, I want my class context already remembered so I can generate something useful with almost no typing.

When I have more planning time, I want to prepare and save several activities in advance.

When the AI produces something almost right, I want to make tiny edits instead of regenerating repeatedly.

When I already have a good activity, I want to reuse or adapt it rather than recreate it.

## 4. Core entities

### Teacher
Single trusted teacher user in the immediate MVP; multi-teacher accounts are deferred.

### Class
Persistent context that should be automatically injected into each generation.

Required:
- Class name
- Grade / age level
- Subject or course

Optional:
- Course description
- Current unit
- Typical student needs / reading level notes
- Default device mode
- Default duration
- Persistent student-facing arrival instructions
- AI guidance / class norms

### Saved chip
A short reusable concept or instructional intention associated with a class.

Examples:
- scientific reasoning
- retrieval practice
- sketch
- evaluate
- perspective drawing
- vocabulary
- curiosity hook
- analyze evidence
- make a prediction
- reflect
- iteration
- ATL: communication

Teacher can create, rename, delete, and tap multiple chips.

### Daily generation context
Lightweight input that changes from lesson to lesson.

Fields:
- “What are students working on?” — optional free text
- “What should this practice or accomplish?” — optional free text
- selected saved chips
- device mode
- duration
- activity style (optional)
- Surprise me

### Activity
Saved generated board item.

Contains:
- title / hook
- primary student task
- optional supporting detail / prompt(s)
- optional arrival instructions
- estimated time
- class association
- device mode
- optional link for device-on activity
- generation metadata
- teacher-edited final content
- created date
- favorite flag

## 5. Primary workflow

### A. First-time setup
1. Teacher opens the workspace; host-level sign-in protects private deployments.
2. Teacher creates a class.
3. Teacher enters grade, subject, and useful course context.
4. Teacher optionally adds persistent chips.
5. Teacher lands on the class generator.

Target setup time: under 3 minutes.

### B. Fast daily workflow
1. Open app.
2. Select class.
3. Optionally tap one or more chips.
4. Optionally type one sentence of current context.
5. Choose Device Off or Device On.
6. Press Generate.
7. Review.
8. Make a tiny edit if needed.
9. Press Present.

Target: 20–60 seconds.

### C. Planned workflow
Teacher can generate activities ahead of time, save them, and open them from History later.

## 6. Generator controls

### Primary controls — always visible
- Class selector
- Current unit/context text input
- saved chips
- Device Off / Device On segmented control
- Generate button
- Surprise Me action

### Secondary controls — compact or collapsible
- duration: 5 / 7 / 10 minutes
- activity style
- practice goal
- persistent arrival instructions on/off

Keep model settings and prompt controls out of the classroom workflow. A subtle teacher-only usage line below Create board shows reported tokens this visit; details and the visitor’s API key live in AI settings.

## 7. Activity styles
These are guidance categories, not rigid templates.

Initial set:
- Curiosity Hook
- Retrieval Practice
- Explain / Reason
- Observe & Notice
- Draw / Sketch
- Predict
- Compare / Contrast
- Evaluate / Critique
- Quick Write
- Apply
- Reflect
- Surprise Me

The AI may combine categories when sensible, but the student task must remain singular and achievable in the time limit.

## 8. Device modes

### Device Off
Default philosophy:
- notebook, paper, whiteboard, sketchbook, or mental reasoning
- no browser required
- no peer interaction required
- no teacher assistance required
- no special materials unless included in class context

### Device On
May ask students to:
- open a teacher-provided URL
- inspect a short digital resource
- search for something narrowly defined
- respond to a digital stimulus

For MVP, Boardwork should **not** browse the web automatically or invent URLs.

The deliberate exception is teacher-initiated **Find official sources** in class curriculum setup. This searches public publisher material, retrieves the document, and creates a reviewable draft. It never runs during daily generation and does not give students a new resource URL. Only explicitly approved, applicable excerpts can ground future boards. Publisher retrieval and teacher approval do not establish standards compliance.

If a URL is needed, teacher enters it. AI can build an activity around the provided resource.

## 9. Generated-board content model
The system should normally produce:

**Eyebrow (optional):** DO NOW / START HERE / THINK & SKETCH  
**Title:** a short human title or curiosity hook  
**Task:** 1–3 short sentences telling the student exactly what to do  
**Prompts:** up to 3 concise bullets only if they improve the task  
**Time:** “7 min” or equivalent  
**Optional footer:** persistent classroom arrival instruction

Avoid excessive sections.

## 10. Editing
Generated content must become normal editable text.

Teacher can:
- edit title
- edit task
- edit prompts
- change time
- remove any element
- regenerate only the activity if needed
- save
- duplicate
- present

No rich-text editor is needed for MVP. Plain structured fields are enough.

## 11. History
History should show:
- date
- class
- title
- activity style
- device mode
- favorite

Actions:
- Open
- Present
- Duplicate / Remix
- Favorite
- Delete

Keep this visually lightweight.

## 12. Export
MVP:
- Export the presentation board as PNG at a high enough resolution for slides/documents.

Later:
- PDF
- Google Slides
- shared links
- template packs

## 13. Success criteria
The product succeeds when:
- a teacher can generate a usable board in under one minute;
- most outputs require zero or very small edits;
- students can understand what to do without verbal explanation;
- the board remains readable on a classroom projector;
- a teacher willingly uses it repeatedly because it reduces morning/class-transition friction.

## 14. Non-goals
Do not turn Boardwork into:
- a full lesson planner;
- a curriculum authoring platform;
- an LMS;
- a student response system;
- an assessment engine;
- an AI tutor;
- a classroom management system.

Those may be adjacent opportunities later, but they would weaken this MVP.
