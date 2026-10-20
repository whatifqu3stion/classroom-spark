# Classroom Spark / Boardwork

A teacher workspace for creating, editing, saving, and presenting short classroom warm-ups.

AI generation uses **your own OpenAI API key (BYOK)**. Add it in **AI key** in the header; the key stays in memory until refresh. A quiet line below **Create board** shows reported token usage for this visit. Editing and presenting saved boards work without a key.

Run independently with the [Docker quickstart](docs/STANDALONE.md). The stack includes standard PostgreSQL and a persistent PDF volume, starts with a fresh database, and has no Replit runtime dependency.

See [BYOK details](docs/BYOK.md) for key handling, usage accounting, owner-key retirement, and the limits of a shared workspace. Private curriculum documents require access protection at the hosting layer.

The original build brief is in `BUILD_PROMPT.md`; product, design, and technical specifications are in `docs/`.
