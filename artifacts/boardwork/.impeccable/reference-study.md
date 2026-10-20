# Landing reference study and implementation notes

Scope: the new Boardwork homepage. README/portfolio documentation and the existing workspace's visual update are explicitly deferred.

## Evidence

Reviewed https://www.craft.do/ live in the cloud browser and as a responsive browser render using its fetched HTML, five real CSS files and 38 scripts. Captured full pages at 1440, 768 and 390px; hovered 84 visible interactive controls and expanded the product navigation. The local Chromium did not trust the environment proxy certificate, so the responsive reference render used TLS-verified curl responses, without disabling certificate validation. Live browser computed styles independently confirmed the layout and fonts.

Downloaded the supplied 37.04-second video into temporary storage, extracted 1111 frames at 30fps and inspected four chronological contact sheets in order, with samples every 15 frames. Its native rate is 24fps; resampling introduces duplicate frames, so these samples establish sequence, not exact original animation frame counts. Scroll begins around 2s (frame 61), writing appears around 6.5–7.5s (frames 196–226), planning around 10–11.5s (301–346), organization around 12.5–14.5s (376–436), themes around 17.5–19s (526–571), community around 24.5–26s (736–781), plans around 29.5–31s (886–931), final call to action around 33–35s (991–1051). These are recording positions, not claimed UI transition durations or easing measurements. The newer live page adds an integration section absent from the supplied video.

Reference assets and recordings remain outside the repository. No Craft imagery, fonts, copy, logos or product claims ship.

## Page sequence, paraphrased

Hero with application preview; overview of functions; customer use cases; writing demonstration; integrations (live version); awards; customer quotation; planning demonstration; organization choices; customer quotation; customization gallery; customer quotation; community links; plans; closing action; footer.

Navigation links to feature pages for writing, planning, organization and customization, as well as product updates, integrations, pricing, learning and downloads. Expanded product navigation also includes the blog and support. Community/footer links include Slack, Reddit, social channels, templates, comparison/use-case pages, company information and legal/security pages. Boardwork adapts the navigation to three useful in-page destinations and the working workspace rather than copying unsupported pages.

## Values read from source CSS and computed styles

| Property | Craft reference | Boardwork adaptation |
| --- | --- | --- |
| Display type | Untitled Serif, 400; 48px base, 58px >=640, 62px >=1024, 66px >=1280, 74px >=1536; line height 1; tracking -.04em then -.03em | Existing self-hosted Bitter, 400; fluid 44–76px; 1.08 leading; -.035em tracking |
| Body | Untitled Sans, 400/500; Inter fallback; 16px / 24px baseline | Existing self-hosted Inter; Open Sans in illustrative student boards |
| Main section headings | 38–60px across breakpoints; desktop 54px / 59.4px; -.02em tracking | Shared landing section/feature typography tokens |
| Layout | Desktop content 1080px, navigation max 920px, section rhythm 48–80px with 60px panel padding | Same content/nav proportions, fluid section spacing and responsive stacking |
| Color | Source tokens include #030302 ink, #fcf9f7 background; blue/lavender, yellow, green fields and original paper imagery | Existing warm canvas and dark slate family; landing lavender, butter, sage fields; user-selected grainy purple/blue hero |
| Shape | Hero 24px radius; desktop nav 52px tall / 26px radius; floating pill controls | Section 24px, panel 16px, pill control tokens |
| Depth | Multi-layer downward soft shadows; 12px/12px nav layer plus 2px/4px secondary layer | Three named downward shadow tokens |

## Motion inventory

Source-confirmed timings are distinguished from our authored motion. Craft's CSS declares normal link/state transitions at 200ms, cubic-bezier(.4,0,.2,1). Navigation backdrop blur changes 4px to 12px in 100ms. The navigation script declares desktop menu motion at 200ms, mobile at 400ms, the same easing, and opacity/scale popup transitions at 100–200ms. Collapsible menu CSS also transitions grid rows/opacity/max-height at 400ms. The gallery uses Splide; do not infer a loop rate from the recording. The sampled scroll sweep exposed no active Web Animations in the inspected states, so independent section-reveal durations and stagger could not be established. Video scrolling alone does not establish an easing curve.

Boardwork uses its existing Framer Motion: hero settle 900ms with 80ms offset; once-only visible-to-visible content entrances 720ms; example change 180ms; mobile disclosure 200ms; arrow hover 160ms; bounded hero-image scroll translation 0–48px. Shared easing is cubic-bezier(.16,1,.3,1). Only transform, opacity and filter animate. No continuous loop or scroll hijacking. Content is visible by default, and reduced motion disables parallax, entrance effects, smooth anchor scrolling and modal animation.

## Integration and truth

Home is now `/`; workspace is `/app`; activity/history/presentation URLs remain usable. The workspace bundle and data provider load only on operating routes. Interactive samples and preview are explicitly illustrative and call neither the backend nor an AI provider. No adoption, conversion, time-saving benchmark, customer or pricing claim is invented. The existing single-workspace storage and BYOK model are explained in the FAQ.

The hero background is an original generated asset based on the user's grain/color reference. Its prompt/provenance is retained; the screenshot's text and branding are excluded. This intentional purple/blue shift replaces Craft's sky/paper hero treatment. Bitter/Inter/Open Sans preserve the product's licensed local font system instead of using Craft's proprietary faces. No placeholder asset requires replacement.

## Validation

Existing 228 component tests pass; three new browser regression checks cover zero API access on the landing page, subject switching, classroom preview/focus return, FAQ, compact navigation/Escape/anchors and reduced motion. A separate browser pass at 1440, 768, 390 and 360 checks the workspace launch and history return, no overflow, >=44px controls and no relevant console errors. Conservative minimum background contrast across the headline/body bounding rectangles is 6.25:1 / 5.41:1 at desktop, higher at the other tested sizes. The production frontend build passes; existing sourcemap and chunk-size warnings remain.

Impeccable's concept catalog was unavailable on two attempts. The user-pinned live reference, video and attached grain example supplied the direction and calibration. Its one detector run only flagged pre-existing shared font declarations and a pre-existing presentation width transition outside this landing scope.
