# Boardwork

**An education tool for creating classroom activities and keeping everyday teaching tools in one place.**

At the start of a lesson, I might be welcoming students, taking attendance, and finding materials. Students still need to know what to do. Boardwork grew out of that problem: prepare a clear activity, put it on the board, and keep the timer and other useful tools nearby.

It began with start-of-class activities. The workspace now includes saved class context, editable tasks, and a classroom Homebase for timers, agendas, notes, and resources.

[View the public demo](https://whatifqu3stion.github.io/classroom-spark/) · [Install and run Boardwork](#install-and-run-boardwork)

**Status:** working prototype. The public demo is a screenshot tour, not the editable application. The features shown here are on [`feat/classroom-homebase`](https://github.com/whatifqu3stion/classroom-spark/tree/feat/classroom-homebase), under review in [PR #3](https://github.com/whatifqu3stion/classroom-spark/pull/3).

![Boardwork Homebase with a student task, timer, agenda, and classroom clock](docs/screenshots/homebase.png)

*A saved Homebase keeps the task and routine together. Rearrange the tools, lock the layout, and switch to presentation view.*

## From preparation to the classroom

### Keep the useful context; change today's task

Classes and units carry forward the details a teacher would otherwise enter again. Start blank or draft with AI, then edit, save, duplicate, or export the activity. I wanted an almost-right draft to be something you could fix directly.

![Activity editor with saved class context beside an editable task](docs/screenshots/activity-editor.png)

### Give students a clear next action

The student display focuses on instructions, prompts, and time. Teacher notes stay out of presentations and PNG exports. Actual projector feedback led to larger, more widely spaced prompts: a layout that worked on a laptop was still too crowded in the classroom.

![Student presentation with a task, prompts, and countdown](docs/screenshots/student-presentation.png)

### Let teachers inspect what AI will use

Curriculum summaries and source excerpts begin as drafts. Teachers can check and edit them before approval. Approving a source makes it available to the generator; it does not certify the resulting activity.

![Curriculum review dialog with an editable summary, source excerpt, and approval action](docs/screenshots/curriculum-review.png)

*Screenshots use illustrative content, not student records. The curriculum view shows a protected setup. [Capture notes](docs/screenshots/README.md).*

## Decisions beyond the first screen

The Homebase brings together timers, notes, agendas, drawing, participation tools, and linked media. There are [21 tool types](docs/HOMEBASE.md), but a teacher chooses which belong on a particular board. Keyboard layout controls provide an alternative to dragging, and the layout can be locked before presenting.

Saving needs care too. A failed request should not erase a lesson's preparation. Conflicting edits are rejected rather than silently overwriting work, and recovery drafts give the teacher something to return to.

I set the direction and classroom requirements, review the experience, and use AI coding tools to develop and revise the application and tests. My teaching experience informs the work; broader user testing is still needed.

## How the app is put together

**React, TypeScript, Vite, and Tailwind CSS** on the frontend; **Express, PostgreSQL, Drizzle, and shared Zod validation** behind it. Docker Compose runs the app and database without depending on the original hosting platform.

The boundaries matter more than the list of tools:

- **Drafting is separate from teaching.** Structured AI responses are validated before saving, with bounded repair for malformed output. Teachers still judge the content; a valid response shape does not make an activity correct or appropriate.
- **Saving checks what changed.** Homebase writes are serialized and carry an expected revision. Stale writes are rejected, while a local recovery draft remains available. Copying a task into a Homebase does not change its original activity.
- **Presentation has a different audience.** Student views exclude teacher notes. External media loads on request, with an open-in-new-tab fallback when embedding fails.

[Architecture](docs/TECHNICAL.md) · [Homebase implementation](docs/HOMEBASE.md) · [Verification record](docs/TESTING.md)

## Install and run Boardwork

You need Git and Docker with Compose v2. These steps use the working branch shown above and create a fresh database.

1. **Clone the project and open its folder.**

   ```sh
   git clone --branch feat/classroom-homebase https://github.com/whatifqu3stion/classroom-spark.git
   cd classroom-spark
   ```

2. **Create the local configuration.**

   ```sh
   cp .env.example .env
   ```

   Open `.env` in your editor and set a strong `POSTGRES_PASSWORD`. Do not put visitor OpenAI keys in this file.

3. **Build and start the app and database.**

   ```sh
   docker compose up --build --detach --wait
   ```

4. **Open `http://localhost:8080`.** Create a class and choose **Start blank**. To generate an activity, add your own OpenAI key through **AI key**; it stays in memory until refresh. Editing and presenting saved work do not need a key.

To stop the app while keeping its data, run `docker compose down`. See the [standalone guide](docs/STANDALONE.md) for non-Docker development, backups, and hosting.

**Hosting boundary:** this is one shared teacher workspace, not a multi-user service. Keep it local or provide access protection at the hosting layer. Bringing an API key does not authenticate a visitor. Private account imports, remote student voting, live weather/news, teacher accounts, and billing are not implemented.

## What I'd test next

Can other teachers reach a useful activity without help? How much editing do they need, and can students begin independently? I also want to test more actual projectors and review AI drafts against a consistent set of teaching requirements. Time savings and learning gains have not been measured.

The broader direction includes higher education, adult learning, and workplace training. That is [future scope](docs/EDUCATION_STRATEGY.md), not a claim that the current classroom prototype already serves all those settings.

[Product notes](docs/PRODUCT.md) · [Design](docs/DESIGN.md) · [AI generation](docs/AI_GENERATION.md) · [Curriculum review](docs/CURRICULUM.md) · [Key handling](docs/BYOK.md)
