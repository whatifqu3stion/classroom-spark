# Boardwork — UX & Visual Design Specification

## Design north star
**Notion clarity + Linear polish + Raycast efficiency + restrained Apple-like attention to typography and spacing.**

This is a reference for design qualities, not an instruction to clone any product.

Boardwork should feel like a calm, premium professional tool for educators.

## Avoid
- cliché AI gradients
- glowing purple/blue “AI” effects
- robot/sparkle/brain imagery
- oversized dashboard chrome
- dense analytics cards
- generic SaaS admin layouts
- excessive rounded cards inside rounded cards
- unnecessary illustrations
- gamification
- decorative glassmorphism
- over-animation

The app should not advertise AI visually. AI is an implementation detail.

## Visual hierarchy
Use hierarchy deliberately through:
1. scale
2. weight
3. whitespace
4. contrast
5. grouping
6. restrained color

Do not rely on borders around every element.

## Typography

### Teacher interface
Use a modern, highly legible sans-serif with excellent UI metrics.
Preferred: **Inter** or **Geist Sans**.

### Student presentation
Use the fixed Bitter / Open Sans pairing, scoped to presentation surfaces:
- Main instruction: Bitter semibold (600), with 1.18 line-height so wrapped
  instructions read as one connected block.
- Prompts and supporting text: Open Sans medium (500), retaining existing
  prompt leading and list/section spacing.
- Small eyebrow labels: Open Sans bold (700).
- Authored bold: real 700 weights in both families; retain mathematical and
  timer numeral font treatments.

Apply the same instruction leading in editor preview, live Present (including
adaptive fitting), and fixed PNG export. Keep the teacher interface on Inter.
Bundle used presentation faces locally with license attribution and wait for
them before PNG capture; do not add a font picker or runtime font CDN.

Rules:
- large title
- generous line height
- short line lengths
- sentence case for most text
- avoid all-caps except very small labels such as “DO NOW”
- never shrink student-facing copy merely to fit too much content

Projector readability is more important than preserving every generated word.

## Color
Default to a refined light neutral interface.

Suggested palette direction:
- warm white / soft neutral background
- charcoal text rather than pure black
- muted slate secondary text
- one confident accent color
- gentle semantic colors only where needed

The specific accent can be chosen during implementation, but keep saturation controlled.

Student presentation may use a subtle accent block or rule for identity, but should remain high contrast.

Do not use bright rainbow palettes by default.

## Shape
- modest corner radii
- subtle separators
- very limited shadows
- buttons should feel tactile but not chunky
- chips should be compact, clearly selectable, and keyboard accessible

## Motion
Use motion only to communicate state:
- subtle fade/scale on generated result
- fast chip selection feedback
- smooth presentation transition

Avoid ambient animation.

Respect reduced-motion preferences.

## Layout architecture

### Desktop teacher workspace
Two-column feeling is acceptable, but avoid a dashboard grid.

Preferred composition:
- slim top navigation
- class/context controls in a focused left/upper region
- generated activity preview as the dominant object
- one obvious primary Generate action

The generated board should feel visually important even while editing.

### Mobile
Teacher controls stack vertically.
Primary actions remain reachable without hunting.
Presentation mode is not optimized for students on a phone; teacher management is.

## Class workspace
Suggested order:
1. Class name + small class switcher
2. context input
3. saved chips
4. Device Off / Device On
5. optional secondary controls
6. large Generate button
7. generated board preview

Do not make the teacher fill out a form before every generation.

## Saved chips
- compact pill controls
- selected state must be obvious without relying only on color
- include a small “+ Add” affordance
- allow keyboard entry and Enter to save
- repeated chips should surface naturally, but do not build recommendation algorithms in MVP

## Generation state
While generating:
- keep the existing layout stable
- show a restrained progress indicator or “Creating board…”
- do not show fake chain-of-thought, rotating AI slogans, or verbose status copy

On error:
- explain the issue plainly
- preserve the teacher’s inputs
- provide Retry

## Activity editor
The edit state should feel close to the final board.

Allow inline editing of:
- title
- main task
- prompts
- footer/instructions
- time

Keep Present as a strong secondary/primary action depending on state.

## Presentation mode — highest-priority screen

### Goal
A student entering the room should understand:
- that they should start;
- what they need;
- what task they are doing;
- how long they have.

Within roughly five seconds and from classroom distance.

### Presentation requirements
- fills viewport
- no teacher navigation
- no edit controls
- no browser-like visual clutter inside app
- generous safe margins
- title large enough for a projector
- task substantially larger than normal web body text
- maximum useful line length
- minimal content
- timer value visible but not dominant
- optional arrival instructions clearly separated
- task and rail tops aligned intentionally instead of independently centered, with no forced heights
- flat, simplified framing for visuals (no drop shadows or glows)
- modest eyebrow tracking and proximity; preserve authored breaks without inferring sentence roles
- shared neutral image backing in preview, Present, and export; never recolor uploaded pixels

Fixed PNG geometry is independent of browser width. Its rail must not inherit
the narrow live layout's second-row placement. Keep the 1920×1080 composition
and validate authored element bounds, not just the outer canvas dimensions.

Suggested responsive type using `clamp()` rather than fixed pixels.

### Live timer sizing
- The minimized timer uses a 7.5rem circular surface and 1.75rem ordinary-duration
  digits (21pt at the default root size). Longer readings scale by character
  count, leaving clearance between the text corners and the ring's inner stroke.
  Background, hover, and keyboard focus belong to the circular trigger only;
  the separately positioned controls panel must not be clipped to the circle.
- Large timer numerals scale from the timer card's usable inline width, with
  one-line fitting for long durations. Both timer-only and visual-plus-timer
  layouts continue growing throughout divider resizing, rather than stopping
  at viewport-based font caps. Short screens use a smaller width coefficient
  to reserve room for visuals and actions, not a fixed numeral-size ceiling.
- Keep the reading intrinsically left-aligned and the progress/actions full
  width. Live timer surfaces, controls, and alarms remain excluded from exports.

### Adaptive Present typography

Live landscape Present boards use a measured, growth-only type fit for the
student task and prompt stack. The fit is intentionally based on the actual
left content pane after the optional divider, not on total viewport width:

- the readable desktop baseline is at least 24px for both task and prompts;
  narrow/mobile flow keeps its established smaller baseline;
- task and prompt type, line-height, and their block/list gaps grow together;
- width-derived ceilings prevent a narrow divider pane from producing giant
  isolated words (roughly 86px for tasks and 58px for prompts at the widest
  useful pane);
- the vertical candidate budget reserves the arrival/header rows, main
  padding, footer minimum, safe-area space, and approximately 18% of the
  remaining room;
- long authored stacks keep the readable baseline and flow/scroll rather than
  shrinking below it.

Candidates are measured in an offscreen clone of the real surface, main,
content, and formula-rendered hierarchy. The live stack is never temporarily
styled for probing, so ResizeObserver cannot feed a growing content height back
into the next candidate. A bounded binary fit is quantized for stable results,
and only stable pane/viewport/arrival/header geometry, font readiness, and
divider changes trigger another fit. Supporting footer text above its minimum
height is normalized out of the student budget, so a materials note cannot
change student-facing type. The fit is live-only; editor previews and fixed
PNG export retain their established geometry.

### Example structure
DO NOW                                      7 MIN

**Which cell is in trouble?**

Draw two simple cells:
- one placed in very salty water
- one placed in fresh water

Predict what happens to each cell.  
Use **osmosis** in your explanation.

Notebook • Work independently

This should look like a designed slide, not a website screenshot.

## Student-facing language principles
- direct
- warm but not childish
- concrete verbs
- grade appropriate
- short sentences
- no unnecessary teacher jargon
- no “As an AI…” language
- no instructional-design meta language
- no long preamble

Prefer:
“Sketch two possible solutions. Circle the one you would build first and explain why.”

Avoid:
“Students will engage in an ideation exercise in which they are expected to…”

## Accessibility
- WCAG-conscious contrast
- visible keyboard focus
- semantic labels
- no essential information communicated only by color
- large pointer targets on mobile
- support browser zoom
- student presentation should remain readable at 1280×720 and 1920×1080

## Empty states
Use useful empty states, not illustrations.

Example:
“Add a few reusable ideas for this class.”
[+ Add a chip]

## Design QA question
Before accepting any screen, ask:
“Does this look like a thoughtful product designer made it, or like an AI generated a generic SaaS dashboard?”

If the latter, simplify.
