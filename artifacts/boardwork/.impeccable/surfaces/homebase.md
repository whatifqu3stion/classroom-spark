---
version: 1
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

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries

Keep existing generation, BYOK, saved context, activity presentation, and export behavior. Reuse selected activity content without exposing teacher notes. No paid AI calls. These boards belong to the current single shared teacher installation; no multiuser or collaboration claims. Embedded resources load only after an explicit click. Google OAuth, live remote polls, weather/news feeds, billing, and AI quality evaluation remain separate work.
