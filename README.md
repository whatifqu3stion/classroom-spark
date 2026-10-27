# Boardwork

**An education tool for creating classroom activities and keeping everyday teaching tools in one place.**

At the start of a lesson, I might be welcoming students, taking attendance, and finding materials. Students still need to know what to do. Boardwork grew out of that problem: prepare a clear activity, put it on the board, and keep the timer and other useful tools nearby.

It began with start-of-class activities. The workspace now includes saved class context, editable tasks, and a classroom Homebase for timers, agendas, notes, and resources.

[View the public demo](https://whatifqu3stion.github.io/classroom-spark/) · [Install and run Boardwork](#install-and-run-boardwork)

**Status:** working prototype. The public demo is a screenshot tour, not the editable application. The features shown here are on [`feat/classroom-homebase`](https://github.com/whatifqu3stion/classroom-spark/tree/feat/classroom-homebase), under review in [PR #3](https://github.com/whatifqu3stion/classroom-spark/pull/3).

![Boardwork Homebase with a student task, timer, agenda, and classroom clock](docs/screenshots/homebase.png)

*A saved Homebase keeps the task and routine together. Rearrange the tools, lock the layout, and switch to presentation view.*

## What it does

- **Prepare activities:** save classes and units, start with a blank task or an AI draft, then edit, save, duplicate, or export it.
- **Present clearly:** show student instructions and timing without exposing teacher notes.
- **Keep classroom tools together:** build reusable Homebases with timers, notes, agendas, drawing, participation tools, and linked media.
- **Review AI context:** check imported curriculum summaries and source excerpts before approving them for future drafts.

![Activity editor with saved class context beside an editable task](docs/screenshots/activity-editor.png)

*An almost-right draft should be something you can fix directly.*

![Student presentation with a task, prompts, and countdown](docs/screenshots/student-presentation.png)

*The student view focuses on what to do next. A separate PNG export fits into existing slide decks.*

Screenshots use illustrative content, not student records. [Capture notes](docs/screenshots/README.md).

## A few decisions that mattered

I wanted useful class context to carry over between lessons, without making today's task harder to change. AI is optional, and its output stays editable. Approving a curriculum source makes it available to the generator; it does not certify the resulting activity.

The editor and classroom display serve different people, so teacher notes stay out of presentations and exports. Actual projector feedback also led to larger, more widely spaced prompts. Looking good on a laptop was not enough.

Saving needs care too. Conflicting edits are rejected rather than silently overwriting work, and recovery drafts help preserve changes. Keyboard layout controls offer an alternative to dragging tools around.

I set the direction and classroom requirements, review the experience, and use AI coding tools to develop and revise the application and tests. My teaching experience informs the work; broader user testing is still needed.

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

**Hosting boundary:** this is one shared teacher workspace, not a multi-user service. Keep it local or provide access protection at the hosting layer. Bringing an API key does not authenticate a visitor. Private account imports, teacher accounts, and billing are not implemented.

## Under the hood and next steps

React, TypeScript, Vite, and Tailwind CSS on the frontend; Express, PostgreSQL, Drizzle, and shared Zod validation behind it. Docker Compose runs the app and database. [Verification notes](docs/TESTING.md) separate automated checks from classroom observations.

The next test is whether other teachers can reach a useful activity without help, how much editing they need, and whether students can begin independently. I also want to test the display on more actual projectors. Time savings and learning gains have not been measured.

[Product notes](docs/PRODUCT.md) · [Design](docs/DESIGN.md) · [Homebase tools](docs/HOMEBASE.md) · [AI and curriculum](docs/AI_GENERATION.md) · [Architecture](docs/TECHNICAL.md) · [Key handling](docs/BYOK.md) · [Broader education direction](docs/EDUCATION_STRATEGY.md)
