---
version: 1
slug: "artifacts-boardwork-src-pages-landing-tsx"
primary_target: "artifacts/boardwork/src/pages/landing.tsx"
related_targets: []
---

# Homepage / landing.tsx

Mode: Persuade. Teachers should understand a focused entry-task tool and open the existing workspace. The user explicitly chose a new homepage with the workspace at /app, pinned Craft's entire direction, and deferred README/portfolio screenshots until the later workspace visual update. Preserve app behavior, truthful BYOK disclosures, no fabricated metrics, testimonials, schools, pricing, or live AI claims. Product name remains Boardwork; Classroom Spark is the repository.

## Direction contract

THESIS: Make the first minutes tangible: show the current app helping a teacher prepare, present and reuse a clear, worthwhile task students can begin independently. Keep the airy paper-and-sky classroom world and connect each screenshot to its classroom value.

OWN-WORLD: Craft-pinned floating pill navigation, light serif display, an original grainy lavender/periwinkle/cyan field, lavender and butter-yellow demonstration fields, sage close, charcoal copy. Reuse Inter, Bitter, Open Sans, BrandMark, Button, Tabs, Accordion and Framer Motion. Scope new tokens to the landing page.

STORY: Recognize the competing demands of arrivals, attendance and student questions; explore Prepare, Present and Reuse screenshots; see remembered class/unit context, review/edit controls, instructions/timer and saved-board filters/favorites; understand memory-only BYOK; open the workspace. Short prompts can revisit prior learning, support prediction and invite explanation; no measured learning outcomes are claimed.

FIRST VIEWPORT: Centered pill nav above “Make the first minutes matter” and two clear actions. The lower half is a large actual-product screenshot frame over the original grainy organic purple-blue artwork. Prepare / Present / Reuse Tabs switch the real workspace/editor, presentation and history views. Captions identify the actual app with sample classroom content. Each screenshot can open an accessible enlargement dialog.

FORM: Explicit user-pinned Craft direction overrides seed b82df018, assigned index 4. The service returned a degraded roll twice; no catalog challengers or quality-bar boards. Build directly against the supplied live reference/video and the user's exact structural direction, with browser evidence, rather than inventing a competing world. Root homepage /; existing app /app. The later workspace cohesion refinement is complete and is now the screenshot source. This landing update changes no app internals; README/portfolio work remains deferred.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Motion

Only transform, opacity and filter animate. Shared durations: hover 160ms, menu 200ms, product-view fade 180ms, entrance 720ms, hero 900ms, stagger 80ms; exponential ease-out cubic-bezier(.16,1,.3,1). Product-view changes animate opacity only (0.65 to 1), with no subject-board translation. Entrances once from visible defaults, a bounded hero parallax, no ambient loop. Reduced motion removes parallax, entrance transforms and smooth scrolling. Mobile menu closes on selection/Escape and returns focus to its trigger. Controls >=44px; 360px no horizontal overflow.

## Reference evidence

Temporary source: /tmp/craft-reference/. Full-page captures at 1440, 768, 390; TLS-verified curl resource transport used for local browser because native Chromium lacked the environment proxy CA. Live cloud browser independently confirmed appearance and computed styles. 84 visible interactive elements hovered. CSS and 38 page scripts downloaded. Reference video downloaded and extracted into 1111 frames at 30fps (original 24fps, duration 37.04s); chronological sheets inspected. Live site has an additional Imagine section absent from the older supplied video. Original Craft fonts and imagery are research-only and never ship.

## Accepted steering
The user replaced the hero collage direction with the attached grainy lavender/blue gradient. Keep two dominant hue families, organic transitions and fine film grain, and a pale calm central field for headline readability. Other landing sections and the later app restyle remain as scoped. The image is a generated original inspired by the supplied screenshot, without its text or branding.

The user requested liquid glass on the navigation and sparingly elsewhere. Use a 64% paper/20px-blur nav with a bright edge, inner reflection and 32px radius; echo it in 68% paper/12px-blur demo chrome and the selected product-view pill. Reading surfaces remain opaque. Static CSS enhancement only; opaque fallback for unsupported backdrop filtering, reduced transparency, increased contrast and forced colors.


The user subsequently requested screenshots of the refined app, multiple product elements with their value, and a clearer explanation of the teaching/learning problem. Preserve the pinned visual world and the original hero raster. The illustrative HTML subject boards, miniature projector, saved-board cards and overlapping paper notes are retired. The tour now shows the real setup controls, editor, classroom presentation and history. The hero and page copy connect independent student starts with teachers’ arrival-time logistics, reusable class/unit context and saved boards. Existing BYOK billing, memory-only key, teacher review and shared-installation/access-protection disclosures remain.

## Screenshot implementation

- `ProductPicture` uses explicit dimensions and descriptive alt text. At 40rem and below, workspace, presentation and history use actual compact UI captures; setup uses its captured control pane. The first workspace image is eager, secondary inline images are lazy, and inline decoding is asynchronous.
- Hero geometry is `--landing-product-aspect: 4 / 3`, switching to `--landing-product-aspect-compact: 358 / 689` on compact screens. Screenshots are contained rather than cropped. The setup figure is limited by `--landing-setup-width: 22rem`. Existing window/container tokens remain intact.
- `ScreenshotPreview` uses the shared Dialog for an accessible title/description, focus management, Escape dismissal and focus return. The full-image button has a named Enlarge action and a 44px paper-pill affordance. The dialog’s focusable, named screenshot region supports keyboard scrolling, has `max-height: 70dvh`, and renders the desktop image at `width: max(100%, 64.5rem)`. “Full-size” is the UI label; the CSS does not imply one source pixel per display pixel.
- Hero captions state “Actual app · sample classroom content.” Section figures explain saved class/unit/topic controls, classroom presentation and history. Landing-specific screenshot, preview and caption styles do not alter capture-source presentation or workspace styles.
- Seven shipping WebPs in `public/images/landing/product/` total 932320 bytes. Each `.webp.json` sidecar records capture origin and source details, also embedded in the image metadata. `scripts/capture-product-screenshots.mjs` seeds prewritten sample state locally, blocks external/unknown API calls and performs no paid AI generation; originals are browser PNGs, converted losslessly without compositing. The original hero remains the eighth landing raster, with its existing prompt/provenance.

## Finish evidence

The independent finish review returned **ship**, with no material fixes. `/tmp/boardwork-product-review/qa.json` and the corrected desktop/tablet/mobile/compact captures cover 1440, 768, 390 and 360px, screenshot Tabs, enlargement dialogs, keyboard navigation, FAQ, mobile navigation and the workspace destination. Corrected capture evidence waits for offscreen/lazy images to complete and paint; all 21 reviewed image captures were valid. No horizontal overflow, runtime errors or API calls were observed. Reported validation: 228 component tests, three updated landing browser tests, production build and typecheck passed. The changed landing source had no mechanical-detector findings; existing font/presentation findings outside this landing scope were left unchanged. Provenance scan: eight landing rasters, none missing provenance.
