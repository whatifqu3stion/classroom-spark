---
name: "Boardwork — landing and workspace"
description: "Shared Boardwork palette and materials, with scoped landing and teacher-workspace roles; presentation contracts remain intact."
colors:
  landing-primary: "hsl(174 20% 16%)"
  landing-primary-foreground: "hsl(0 0% 100%)"
  landing-canvas: "hsl(40 28% 96.5%)"
  landing-ink: "#20302f"
  landing-subtle-ink: "#465453"
  landing-paper: "#fffefa"
  landing-sky: "#cde9f8"
  landing-sage: "#dcebdc"
  landing-peach: "#f6e4d9"
  landing-lavender: "#dde1f6"
  landing-butter: "#f8e8a4"
  landing-mint: "#cde4cf"
  landing-line: "#d7dfdc"
  landing-nav-background: "rgb(255 254 250 / 64%)"
  landing-glass-chrome-background: "rgb(255 254 250 / 68%)"
  landing-glass-control-background: "rgb(255 254 250 / 80%)"
  landing-glass-edge: "rgb(255 255 255 / 70%)"
  landing-selection: "#b6dac8"
  landing-hero-surface: "#d3cff3"
  workspace-canvas: hsl(40 28% 96.5%)
  workspace-ink: hsl(176.25 20% 15.6863%)
  workspace-muted-ink: hsl(175.7143 9.0909% 30.1961%)
  workspace-paper: hsl(48 100% 99.0196%)
  workspace-chrome: color-mix(in srgb, hsl(230.4 58.9744% 91.5686%) 18%, hsl(48 100% 99.0196%))
  workspace-selected: color-mix(in srgb, hsl(230.4 58.9744% 91.5686%) 65%, hsl(48 100% 99.0196%))
  workspace-control-border: hsl(168 9% 54%)
  workspace-focus: hsl(250 30% 42%)
typography:
  landing-display:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(2.75rem, 5.25vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  landing-headline:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(2.1rem, 3.4vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  landing-feature:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(2rem, 3.15vw, 2.875rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  landing-title:
    fontFamily: "Bitter, Georgia, serif"
    fontSize: "clamp(1.5rem, 2.3vw, 2.125rem)"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  landing-board-task:
    fontFamily: "Open Sans, Inter, sans-serif"
    fontSize: "clamp(1rem, 1.5vw, 1.25rem)"
    fontWeight: 500
    lineHeight: 1.55
  landing-body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  landing-lead:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  landing-small:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
  landing-caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
  workspace-page-title:
    fontFamily: Bitter, Georgia, serif
    fontSize: 2rem
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.025em
  workspace-empty-title:
    fontFamily: Bitter, Georgia, serif
    fontSize: 1.5rem
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.025em
  workspace-label:
    fontFamily: Inter, sans-serif
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4286
rounded:
  landing-section: "1.5rem"
  landing-nav: "2rem"
  landing-panel: "1rem"
  landing-pill: "999px"
  landing-control: "6px"
  workspace-panel: 1rem
  workspace-control: 0.5rem
  workspace-popover: 0.75rem
spacing:
  landing-1: "0.25rem"
  landing-2: "0.5rem"
  landing-3: "0.75rem"
  landing-4: "1rem"
  landing-5: "1.25rem"
  landing-6: "1.5rem"
  landing-8: "2rem"
  landing-10: "2.5rem"
  landing-12: "3rem"
  landing-16: "4rem"
  landing-20: "5rem"
components:
  landing-button-primary:
    backgroundColor: "{colors.landing-primary}"
    textColor: "{colors.landing-primary-foreground}"
    rounded: "{rounded.landing-pill}"
    padding: "0 1.5rem"
    height: "3rem"
  landing-button-preview:
    backgroundColor: "transparent"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-control}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  landing-text-link:
    textColor: "{colors.landing-ink}"
    height: "2.75rem"
  landing-nav:
    backgroundColor: "{colors.landing-nav-background}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-nav}"
    padding: "0.5rem 0.75rem"
    width: "min(57.5rem, calc(100% - 4rem))"
  landing-demo:
    backgroundColor: "{colors.landing-glass-chrome-background}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-panel}"
  landing-board:
    backgroundColor: "{colors.landing-sky}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-panel}"
    padding: "1.5rem 2rem"
  landing-saved-board:
    backgroundColor: "{colors.landing-sky}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-panel}"
    padding: "1.5rem"
  landing-feature-context:
    backgroundColor: "{colors.landing-lavender}"
    rounded: "{rounded.landing-section}"
    padding: "4rem"
  landing-feature-present:
    backgroundColor: "{colors.landing-butter}"
    rounded: "{rounded.landing-section}"
    padding: "4rem"
  landing-close:
    backgroundColor: "{colors.landing-mint}"
    rounded: "{rounded.landing-section}"
    padding: "5rem 1.5rem"
  workspace-panel:
    backgroundColor: '{colors.workspace-paper}'
    textColor: '{colors.workspace-ink}'
    rounded: '{rounded.workspace-panel}'
  workspace-navigation:
    backgroundColor: '{colors.workspace-paper}'
    textColor: '{colors.workspace-ink}'
    height: 3.5rem
  workspace-create-button:
    backgroundColor: '{colors.workspace-ink}'
    textColor: '{colors.landing-primary-foreground}'
    rounded: '{rounded.workspace-control}'
    height: 2.75rem
  workspace-selected-control:
    backgroundColor: '{colors.workspace-selected}'
    textColor: '{colors.workspace-ink}'
    rounded: '{rounded.workspace-control}'
  workspace-dialog:
    backgroundColor: '{colors.workspace-paper}'
    textColor: '{colors.workspace-ink}'
    rounded: '{rounded.workspace-panel}'
    padding: 1.5rem
---

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
adaptive fitting), and fixed PNG export. Keep teacher controls and editable content on Inter; reserve light Bitter for page and empty-state headings in the workspace refinement below.
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
- muted green-charcoal secondary text
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
- task and prompt type grow first at fixed leading; only remaining capacity
  can add bounded spacing, never stretch rows to fill the board;
- width-derived ceilings prevent a narrow divider pane from producing giant
  isolated words (86px for tasks and 72px for prompts at the widest
  useful pane);
- the vertical candidate budget reserves the arrival/header rows, main
  padding, footer minimum, safe-area space, and a bounded 4% of the remaining
  room (12–28px);
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
PNG export retain their established fixed frames and type sizes.

### Thinking-prompt spacing

Questions form one supporting group, not extra mandatory responses. Keep more
space below the horizontal divider than between prompt rows, including above
an authored first-line highlight. Do not independently enlarge the task-to-divider
gap. Wrapped lines retain 1.35 leading and hanging bullet alignment.

- Live adaptive fit starts with 24–36px divider padding and 12–18px row gaps;
  residual space is capped at 40px and 22px respectively, after type fitting.
- Static/narrow layouts preserve the same section-over-row hierarchy.
- Editor preview uses 11.2–17.6px divider padding and 6.4–9.6px row gaps.
- The fixed 1920×1080 PNG uses 32px divider padding and 14px row gaps.

Retain Bitter/Open Sans, medium-weight unmarked prompt text, theme-colored
bullets, and all teacher-authored bold, underline, and highlights. No positional
formatting rule belongs on the first prompt.

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


---

# Landing marketing extension — `/` only

## Overview

**Creative North Star: "The everyday art of starting class"**

This extension applies only to the public homepage at `/`, its illustrative examples, and its classroom-preview dialog. The original specification above continues to govern the teacher workspace at `/app`, plus `/history`, `/activity/:id`, `/present`, and `/present/:id`. The workspace cohesion refinement is documented below; README/portfolio work remains deferred. Frontmatter names beginning `landing-` govern marketing roles, while `workspace-` names record the shared palette and operating-surface roles.

The chosen Craft reference informs an airy composition, a floating navigation pill, generous paper surfaces, and light serif headings. The user’s later grainy purple/blue reference supplies the hero material: pale lavender and periwinkle with blue/cyan at the edges and lower field. The visual language remains connected to Boardwork through its local Bitter, Inter, Open Sans and BrandMark. This is a source-led adaptation, not an approved generated full-page comp.

**Key Characteristics:**

- A readable HTML board is the central product object.
- Warm paper, pastel demonstration fields and dark green-charcoal text.
- Fine-grained original purple/blue hero material with a calm light center.
- Restrained, once-only motion and explicit reduced-motion behavior.
- Translucent glass navigation and demo chrome, with opaque reading surfaces.

## Colors

The landing palette combines warm paper and green-charcoal ink with pastel classroom examples. Frontmatter values are normative, derived from `src/index.css`; all names beginning `landing-` are scoped to this extension.

### Primary

- **Landing primary:** the homepage locally overrides the shared Button primary and ring to dark green-charcoal; its foreground stays white.
- **Landing ink:** headings, body and outline focus. **Subtle ink** supports captions and context without competing with the task.

### Secondary

- **Sky, sage and peach:** illustrative Science, Design and Language boards, respectively; subject names and content carry the distinction alongside color.
- **Lavender and butter:** contextual demonstrations and classroom-presentation sections. **Mint:** the closing action field.
- **Hero surface:** the pale lavender fallback beneath the original raster. It is not a CSS approximation of the raster’s grain or organic transitions.

### Neutral

- **Canvas:** inherits the incumbent warm background, recorded as its current resolved HSL value in frontmatter.
- **Paper:** demo window, notes and preview dialog. **Line:** understated toolbar and section separators.
- **Navigation background:** 64% warm paper, with a 20px backdrop blur and 1.3 saturation. **Demo chrome:** 68% paper with a quieter 12px blur. **Selected subject:** 80% paper and the same fine highlight. The track mixes 30% landing lavender into paper. A shared white sheen and 70% white edge describe the glass surface.
- **Selection:** sage text-selection backing with landing ink.

**The Surface Boundary Rule.** The homepage may use the approved original organic gradient, restrained glass on navigation and demo chrome, soft paper shadows and once-only entrances. These are exceptions to the app-only gradient and state-only motion guidance above; they do not authorize gradients, ambient motion or decorative depth in operating or presentation surfaces.

## Typography

**Display Font:** local Bitter, with Georgia/serif fallback. Its existing variable-face registration now covers weights 400–700; the homepage uses 400 for major headings, with 500/600 inside examples.

**Body Font:** local Inter, with sans-serif fallback, using the existing 400/500/600/700 faces.

**Board Font:** local Open Sans, with Inter/sans-serif fallback, using the existing 500–700 registration. The actual example title uses Bitter; tasks, prompts and footers use Open Sans; small board-header context switches back to Inter.

The frontmatter holds the reusable type roles. Display sizes are fluid: hero 44–76px, section 33.6–52px, feature 32–46px and board title 24–34px at a 16px root. Major headings share 1.08 leading and −0.035em tracking. Board titles use 1.18 leading and −0.025em tracking; tasks use 1.55 leading. Body is 16px with 1.65 leading, hero lead is 18px with 1.5 leading, small text is 14px and captions are 12px.

Example task measure is at most 65ch; feature body measure is 40ch on larger screens and 65ch after stacking. Board titles become 1.65rem on small screens. The illustrative projector uses its observed 1.75rem title/1.05rem task treatment on desktop and larger token roles when stacked; this miniature is not the live Present type-fit system. Keep word spaces when responsive line breaks disappear.

**The Product Type Rule.** Use the existing locally bundled families. Light Bitter display on the landing page does not change the workspace’s Inter or the student presentation’s Bitter/Open Sans pairing.

## Layout

The content container is at most 67.5rem (1080px), with 3rem total horizontal inset. Navigation is at most 57.5rem (920px), with 4rem total inset, fixed 2rem below the viewport top at layer 45. The hero is at most 100rem wide, inset 1rem per side with 8.5rem top/3rem bottom padding; the nested demo is at most 64.5rem wide. These are landing proportions rather than a workspace layout prescription.

Spacing resolves from the existing Tailwind 0.25rem base. The frontmatter records the reused 1/2/3/4/5/6/8/10/12/16/20 steps. Vertical section rhythm is `clamp(4rem, 8vw, 7.5rem)`. Feature panels use 4rem padding, a 3rem gap and alternating 1.1:1 or 0.8:1.2 column proportions; library examples form three columns with a 1.25rem gap. Context notes overlap at −3° and +4°; these are readable illustrative objects, not controls.

- **At 64rem and below:** feature padding drops to 2.5rem, gaps tighten, and the extra demo-toolbar line is hidden.
- **At 56rem and below:** desktop links and navigation CTA yield to a 44px menu control. Feature, key-disclosure and FAQ grids stack; context copy comes first; the note illustration stays within 28rem. Feature heading line breaks are removed, preserving word spacing.
- **At 40rem and below:** hero inset is 0.5rem, top/bottom padding is 6.75rem/1.5rem, and content/nav total inset is 2rem. Hero actions and demo controls stack; subject tabs share full width; library boards become one column. Secondary demo status/unit/footer details are hidden, while core task and actions remain. Feature padding is 2rem × 1.5rem. The preview dialog scrolls within `calc(100dvh - 2rem)`.

Principal links, tabs, menu, preview, FAQ triggers and dialog close have at least the 2.75rem (44px) landing target. The primary landing Button is 3rem (48px) tall. The page clips decorative horizontal excess; its content must still fit at 360px and remain usable with zoom. In-page destinations reserve 5rem scroll margin beneath fixed navigation.

## Elevation & Depth

This marketing surface uses soft downward shadows around the product window, floating navigation and paper notes, with tonal fields separating sections. It retains the app’s warm canvas without imposing landing elevation on operational boards.

### Shadow Vocabulary

- **Window:** `0 22px 54px -22px rgb(32 48 47 / 30%), 0 5px 12px -5px rgb(32 48 47 / 12%)`; the main interactive product example.
- **Paper:** `0 10px 24px -12px rgb(32 48 47 / 25%)`; class context and daily-intention notes.
- **Navigation:** `0 12px 28px -14px rgb(32 48 47 / 28%), 0 2px 6px -3px rgb(32 48 47 / 8%)`; the fixed navigation surface.
- **Glass rim:** `inset 0 1px 0 rgb(255 255 255 / 88%), inset 0 -1px 0 rgb(32 48 47 / 8%)`; a bright upper edge and a quiet lower lip.
- **Glass control:** `0 2px 5px -2px rgb(32 48 47 / 18%)`; the selected subject tab.

**The Material Depth Rule.** Landing shadows describe floating navigation, the demo window and overlapping paper notes. The navigation and demo frame share a static glass material with a fine highlight and soft inner reflection; the board-reading area stays opaque paper. Student-facing Present and exported boards retain their existing flat framing.

## Shapes

Broad marketing sections use the 1.5rem radius; demo windows, board samples, saved examples and notes use 1rem. Action pills use the 999px landing token, while the shared Button landing size uses a fully rounded silhouette. Landing navigation uses a 2rem radius that also fits its expanded compact menu. Subject tabs use the shared pill token and a selected glass highlight. The shared dialog retains its 14px outer radius, with 1rem board corners inside. Thin separators group content without boxing every block. Keep these nested forms limited to actual product examples and paper overlaps.

## Components

### Buttons and links

Use the existing Button with `size="landing"`: 48px height, 24px inline padding, 8px icon gap, Inter 14px medium text, a dark primary surface and white text. The existing 90%-opacity primary hover remains. The preview uses the shared ghost variant at a 44px minimum height, including the shared accent hover. Text links use landing ink, 14px medium text, an underline on hover and an 8px icon gap. Their arrows shift 2px right/up in 160ms; navigation CTA arrows share that treatment.

Landing anchors and buttons show a 2px solid landing-ink focus outline with 4px offset, alongside shared focus behavior where applicable. The skip link becomes visible on focus. Color changes do not carry essential state alone.

### Navigation

Reuse BrandMark and the Boardwork name. The glass navigation has no invented dropdown destinations. The shared `landing-glass` class provides opaque paper first, then uses `@supports` to add the shared translucent fill, sheen, border, inner rim, blur and saturation. Reduced transparency, increased contrast and forced-color preferences restore opaque paper and remove backdrop filtering. Forced colors retain a system-color border and a visible selected-tab border. Blur does not animate. Its compact disclosure uses semantic expanded/controls state, closes after link selection, and closes with Escape while restoring focus to the trigger. Mobile link rows are at least 44px high.

### Subject tabs and example boards

The existing Tabs primitive supplies keyboard navigation and selected state. The landing-only pill track and selected highlight echo the navigation glass; demo chrome picks up the purple/blue field, while the example workspace and board surfaces remain opaque. Landing overrides retain 44px controls and remove generic all-property transitions. Selecting a subject changes context and board content together; the change is a short opacity/5px translation. Demo window, board and illustrative captions are HTML, not a screenshot. Board padding is 24px × 32px on desktop and 20px on small screens. Its supporting list remains a coherent group, and materials sit below a quiet rule.

### Classroom preview and FAQ

The existing Dialog supplies accessible title/description, modal focus management and focus return. Its landing width is `min(75rem, calc(100vw - 2rem))`; padding is 20px, dropping to 12px on mobile, and the close control is 44px square. The dark shared overlay and dialog transitions remain shared infrastructure; reduced motion suppresses their animation.

The existing Accordion supplies semantic, keyboard-operable FAQ disclosure. Triggers use body size, 1.5 leading and 20px vertical padding, with quiet separators. Landing disables height animation; only the chevron rotates with the 200ms menu timing. Keep the BYOK/privacy explanation readable in the same type system rather than building a separate settings interface.

### Motion

`MOTION` and `EASE` in `landing.tsx` are the source of truth: fast 160ms, menu 200ms, example 180ms, reveal 720ms, hero 900ms and stagger 80ms; easing is `cubic-bezier(0.16,1,0.3,1)`. The component exports fast/menu/example/ease CSS variables for state styles. Only transform, opacity and filter animate. The hero title starts visibly at 0.9 opacity with a short settling motion; the demo settles from a slight rotation; section entrances run once, also from visible defaults. Hero artwork translates only 0–48px as the hero scrolls. No loop or scroll hijack is part of this extension.

`useReducedMotion` disables the Framer Motion entrance/parallax paths. The CSS reduced-motion rule removes landing/dialog animation and transitions and restores automatic scrolling; smooth anchor scrolling is enabled only for no-preference. Do not move essential information behind an entrance trigger.

### Original hero material

The sole shipping landing raster is `public/images/landing/classroom-gradient.webp`: 1536 × 1024, 146380 bytes. It is an original generated background derived from the supplied grain/color reference, without the reference’s lettering, branding or UI. Fine film grain and organic purple/blue transitions are pixels in the raster; headline, controls and demo stay semantic HTML. The source is decorative (`alt=""`), uses cover positioning and has a pale fallback surface.

The exact generation prompt is retained at `.impeccable/assets/classroom-gradient.prompt.txt`; the public `classroom-gradient.webp.json` sidecar carries that prompt and `createdAt: 2026-10-20T18:56:26.480Z`. These paths are relative to `artifacts/boardwork`. Craft imagery and proprietary fonts remain research-only. The image must keep a calm light central field for dark copy; no unsupported product proof is baked into it.

## Do's and Don'ts

### Do:

- Do scope new marketing styles to the landing page and landing dialog, using the declared `--landing-*` tokens.
- Do retain a light central hero field, dark legible copy and the two dominant purple/blue hue families.
- Do keep illustrative boards as semantic HTML with selectable subjects, accessible preview controls and truthful example labels.
- Do use visible keyboard focus, at least 44px principal controls, balanced headings and responsive stacking.
- Do disable entrance transforms, parallax, transitions and smooth scrolling for reduced motion.
- Do limit glass to navigation, demo chrome and the selected subject; honor opaque fallbacks and contrast/transparency preferences.

### Don't:

- Don’t apply this landing extension to the teacher workspace, live Present or PNG export.
- Don’t ship Craft’s fonts, imagery, logos or copied product claims.
- Don’t convert the grainy hero into a rainbow, animated glow or generic AI motif.
- Don’t animate continuously or hide essential content until an entrance runs.
- Don’t add invented adoption figures, customer evidence, pricing or live-generation claims to the illustrative surface.

---

# Workspace cohesion extension — operating routes

## Overview

**Creative North Star: "The everyday art of starting class"**

The teacher workspace now shares the landing page’s warm paper, green-charcoal ink, restrained lavender selection and soft material edges. It retains the existing setup/editor columns, stacked mobile layout, field order, sticky creation actions, history workflow and save behavior. This is a visual refinement of the working UI, not a new information architecture.

**Key Characteristics:**

- Smooth, opaque reading and form surfaces above a quiet neutral background.
- Familiar Inter controls with light Bitter reserved for page and empty-state headings.
- Matching dark primary actions, pale lavender selection and visible keyboard focus.
- Existing class colors, presentation themes, timer behavior and export geometry remain user-controlled.

## Colors

The `workspace-` frontmatter colors resolve the actual shared CSS roles in `src/index.css`. The warm canvas is retained. Ink, muted ink, paper and lavender now match the established Boardwork family; the control border and purple focus ring keep input boundaries and focus legible. Header/panel chrome and selection use constant mixed colors, never a gradient.

**The Operating Surface Rule.** Grain belongs only to the far workspace background. Cards, fields, overlays and board-reading surfaces stay opaque and smooth. Main-app surfaces use solid colors, with no gradient treatment.

The sticky navigation uses a uniform 94% paper fill and static 12px backdrop blur as a modest echo of the landing glass. It has no sheen gradient or texture of its own. The fallback is opaque paper. Reduced transparency, increased contrast and forced colors remove backdrop filtering and the background grain; selected and focus states retain system-color outlines under forced colors.

## Typography

Teacher controls, labels, dialogs, history rows and editable content continue to use the locally bundled Inter. Page headings and the empty editor heading use the existing Bitter face at weight 400; the three new frontmatter roles record their fixed rem sizes and leading. Functional labels retain the compact UI scale rather than inheriting marketing display sizes. Empty-state guidance now uses full ink/muted-ink roles for readable contrast.

Student task/prompt fonts remain the existing Bitter/Open Sans pairing. Theme selection, projector fitting and fixed PNG typography are governed by the original presentation specification, not by workspace heading styles.

## Layout

Keep the existing slim sticky header: a 3.5rem inner row plus its 1px separator. Desktop retains the 400px setup pane, existing gap and dominant editor; mobile retains the same vertical order and sticky creation actions. History remains a filter row and lightweight saved-board list. No controls, destinations, workflows or factual copy are added or moved.

Navigation targets are at least 44px. Coarse-pointer input adds the same minimum target height to workspace controls without changing desktop density. At enlarged text, long editable blocks scroll into reach; short-height windows may use the full existing pane cap. Dialogs, selects and popovers continue to escape through their existing portals.

## Elevation & Depth

Paper panel shadow resolves from `--teacher-card-shadow`; dialogs and popovers use the new `--workspace-dialog-shadow` and `--workspace-popover-shadow` tokens through Tailwind’s shared shadow aliases. The selected-control rim is a quiet inset highlight plus a short downward shadow, with no gradient or animation. Keep outer workspace panels at one frame; the nested editor remains borderless.

The grain is a static 61647-byte, 256 × 256 monochrome PNG at `public/images/workspace/neutral-grain.png`, repeated at the 12rem material-size token and rendered at 4.5% opacity. Only `.workspace-shell::before` references it, behind content at layer −1 with pointer events disabled. It is not mounted in Present or the exported board. The reproducible seed-2601020 Gaussian recipe and provenance text are retained in `.impeccable/assets/neutral-grain.recipe.py` and `.impeccable/assets/neutral-grain.prompt.txt`; the PNG also embeds that provenance. It contains no color field or directional light falloff.

## Shapes

Shared buttons and inputs use 8px control corners. Main workspace frames and dialogs use 16px corners; menus, popovers and selects use 12px. These are token-based rem values and scale with text zoom. Navigation and history selectors use the established pill shape; controls otherwise keep their familiar silhouettes.

## Components

Reuse Shell, BrandMark, Button, SegmentedControl, Input/Textarea, Select, Dialog/AlertDialog, Popover, DropdownMenu, Saved Context, BoardEditor and PresentationCanvas. Add styling hooks and `aria-current` to the existing workspace/history links; keep their destinations and behavior.

Generator and editor headers use smooth solid chrome; editor content uses opaque paper. Selected technology/duration/history states share the lavender fill and tactile rim. Class, unit, AI-key and context overlays inherit the same smooth paper, border, focus and shadow vocabulary. The live presentation’s teacher controls adopt the shared corner treatment while student surfaces and timer/export calculations retain their existing styles.

No new entrance, background motion or animation library is introduced. Existing reduced-motion support remains in force.

## Do's and Don'ts

### Do:

- Do preserve the existing workspace layout, actions, content, save model and keyboard behavior.
- Do confine neutral grain to the far background and keep UI surfaces smooth and opaque.
- Do use the shared ink, paper, selection, border, focus and corner tokens across operating controls and portals.
- Do preserve user-selected class colors and presentation themes, along with the student-reading and PNG contracts.

### Don't:

- Don’t carry the landing gradient or sheen treatment onto main-app surfaces.
- Don’t add grain to cards, fields, dialogs, editable text, student boards or PNG exports.
- Don’t turn operational labels into display typography or add marketing motion to the workflow.
