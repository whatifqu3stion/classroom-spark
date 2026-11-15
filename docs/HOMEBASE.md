# Classroom homebase

Homebase extends Boardwork's entry-task workflow into a saved classroom board at `/homebase`. It uses the existing teacher workspace and the same shared-installation access model. The activity generator, saved context, BYOK, and original activity presentation/export remain available.

## Classroom tools

- Student activity copies, sticky notes, and checkable agendas.
- Visual countdown timer, timer-only focus, optional soft tones/noise, optional end alarm, stopwatch, clock, current-month date, and event countdown.
- No-repeat name picker, balanced random groups up to a chosen group size, one to six dice, scoreboards, and teacher-recorded show-of-hands votes.
- Traffic signal, work mode, and freehand drawing with pen colors and undo/clear.
- Resource links, linked images, direct linked PDFs, YouTube players, and supported published Google document/slide/sheet and Spotify players.

Resources load after an explicit click. Embedding supports provider player/published paths; it does not import private account files. Providers can prevent embedding, so an open-in-new-tab link remains available. Remote student voting, webcam, sound metering, QR codes, and live feeds are not implemented.

## Daily workflow

Choose a class or General boards, then create a Class arrival, Focus time, or Blank board. Each class can have several named boards. Add tools from the drawer, edit their content, and move/resize with handles. Arrow keys work on the handles; Shift changes the step. Locking hides layout controls. Phone layouts stack tools in board order. Present hides layout chrome. Timer focus enlarges the same running timer instead of recreating it.

Saved activities become independent student-facing copies. Their private teacher notes are excluded; edits do not change the original activity. Timers, stopwatch progress, random picks, and generated groups are live session state and restart when the board is reopened. Agenda checks, votes, scores, and drawings are saved content.

## Saving

Homebases are PostgreSQL documents with versioned, bounded Zod input validation. A generated Drizzle migration creates `homebases`; deleting a class cascades to its homebases. The API supports list/create/update/delete under `/api/homebases`. A null class ID scopes General boards; the class-specific list uses `?classId=<uuid>`.

Updates use an expected revision and one atomic conditional update. Stale updates and deletes return 409. The frontend debounces and serializes saves, preserves edits made during an in-flight save, and keeps a versioned local browser draft until saving succeeds. Conflicts retain the draft and offer Save as a copy. Browser drafts are recovery backups, not cross-device sync or a complete offline app.

These records belong to the existing single shared teacher installation. BYOK is not authentication. A hosted paid multiuser service still needs private teacher accounts and data isolation. Do not store confidential pupil information in board text or name lists.

## Next product work

Keep AI content quality first: teacher-reviewed evaluation cases, a held-out regression set, correctness and startability checks, and a calibrated quality rubric before claiming improved learning or time savings. Then develop activity adaptations, reusable routine sequences and preparation queues. Private Google imports, external weather/news services, remote voting, and hosted accounts need their own source/auth/data contracts.
