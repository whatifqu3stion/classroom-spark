---
version: 2
slug: homebase
primary_target: artifacts/boardwork/src/pages/homebase.tsx
related_targets:
  - artifacts/boardwork/src/features/homebase
  - artifacts/boardwork/src/components/layout/shell.tsx
---

# Classroom homebase

Mode: Operate. Extend the existing teacher workspace with the movable classroom board requested by the user, using Classroomscreen's practical tool range as a functional reference. The user has already specified the purpose, movable tools, timer focus, and the established Boardwork visual system. This is a code-led extension of that pinned board concept; no new visual world or concept round.

## Direction contract

THESIS: A class opens ready to work: the current Boardwork activity sits beside the small tools needed to run the room.

OWN-WORLD: Existing warm paper, green-charcoal ink, Bitter headings, Inter controls, and smooth lavender, butter, and sage surfaces. Solid colors; background grain remains outside tools.

STORY: Choose a class, open or make a remembered board, add tools, arrange them, then present. Content edits save to the database; a local draft and revision check protect interrupted work.

FIRST VIEWPORT: Existing slim app header; compact class/board/action row; a dominant twelve-column board with a broad student task or note, a clearly readable timer, and an agenda. A searchable tool drawer enters from the side only when requested. Mobile stacks tools in board order with reachable actions.

FORM: User-pinned movable classroom canvas, inherited visual world, code-led. Drag/resize handles also support arrow keys. Timer focus enlarges the running timer without restarting it; presenting hides layout controls.

FINISH: Finish review and verdict passed; implemented patterns are recorded in docs/DESIGN.md and the design sidecar. This extension adds no shipping raster.

## Boundaries

Keep existing generation, BYOK, saved context, activity presentation, and export behavior. Reuse selected activity content without exposing teacher notes. No paid AI calls. These boards belong to the current single shared teacher installation; no multiuser or collaboration claims. Embedded resources load only after an explicit click. Google OAuth, live remote polls, weather/news feeds, billing, and AI quality evaluation remain separate work.

## Implemented surface contract

- **Spatial model:** the page is at most 100rem wide. The board uses twelve equal columns, 4rem rows, 1rem gaps and a 1rem inset; row/column position also defines reading order. Dragging/resizing retains the moved tool's placement and makes room below. Arrow keys change one cell; Shift + arrows change three. Locking removes layout controls while live tool actions remain available.
- **Materials:** shared paper, green-charcoal, lavender, butter and sage remain the tool palette. The paper board uses a quieter sage-neutral backing. Tools are smooth, opaque, 1rem-corner surfaces with a quiet movable-object shadow. The 0.375rem action corners, 0.25rem resize grip and functional circles are deliberate local additions. No gradient, glass or grain enters a tool.
- **Reading:** Inter serves tool content and controls, with light Bitter for the page/empty headings and name-picker result. Homebase task copies use their own Inter reading role; the original activity Present and PNG typography remain separate. Fluid timer numerals are functional reading sizes rather than a new heading scale.
- **Timer:** a size-contained face and a 100 × 100 SVG view box keep the ring circular as tool proportions change. Board and focus typography respond to both face width and height. The status and actions remain below the face; “Sound off” is the compact default. Timer focus enlarges the same mounted timer, retaining progress and optional sound state.
- **Responsive behavior:** 701–1050px keeps the grid with tighter tool insets. At 700px and below, tools stack in row/column order, resize grips disappear and pointer gestures permit scrolling. Standard tools reserve 12rem; timer/date/drawing/media tools reserve 23rem. A definite 20rem mobile timer body gives the ring a stable container. Mobile and coarse-pointer actions are at least 44px high; frame actions are also 44px wide.
- **Presentation and focus:** the board becomes a named modal scope over a solid neutral viewport. Covered page/header controls are inert, Tab stays within the live tools and exit controls, and background scrolling stops. Escape exits the current scope and restores the initiating control; timer focus opened within presentation returns to presentation first. Layout chrome is hidden without remounting tool content.
- **Supporting tools:** the searchable 28rem drawer groups Teach, Time, Participate, Routines and Resources. Editors use the shared opaque Sheet/form vocabulary. Traffic-light selection pairs functional color with bold, underlined labels. Media has an explicit load state and an external-resource fallback.

Source authority: `src/pages/homebase.tsx` and `src/features/homebase/{homebase.css,board.tsx,widgets.tsx,catalog.ts,layout.ts,use-focus-scope.ts}` under `artifacts/boardwork`. The Homebase extension in `docs/DESIGN.md` owns the extracted token roles; `.impeccable/design.json` extends them with shadow, breakpoint, motion and component-rendering details.
