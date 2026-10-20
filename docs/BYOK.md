# Bring your own OpenAI key

Classroom Spark no longer uses the owner's paid AI integration or a custom app password. Each visitor supplies their own OpenAI API key in **AI key** in the teacher header. **Create board** opens key settings if no key is present. Editing, saving, history, and presenting existing boards do not require an AI key.

## Key handling

- The visitor key stays in page memory until refresh, key removal, replacement, or page closure. It is never saved in localStorage, sessionStorage, cookies, React Query, or the database.
- The browser sends it only to this origin's AI-related API routes, in `x-boardwork-api-key`. Redirects on those requests fail rather than forwarding the credential.
- The server strips that header before downstream logging, retains the key only in the current request's async context, and forwards it to the fixed `https://api.openai.com/v1` endpoint. Neither client nor environment can choose another destination.
- No owner key fallback exists. `AI_API_KEY`, `OPENAI_API_KEY`, and `AI_INTEGRATIONS_OPENAI_API_KEY` are ignored, even if still configured.
- Use HTTPS in deployment. The application server handles visitor keys transiently, so only enter a key on a deployment you trust. BYOK does not remove the need to secure hosting, logs, dependencies, and the page against script injection.
- Provider errors are replaced with safe messages; the key and upstream request metadata are not returned or retained in error causes.

## Usage display

The quiet line below **Create board** shows **Your key · … tokens this visit**. Clicking it opens input/output token totals and the number of AI requests. Nothing is added to student Present or PNG export.

Usage comes from OpenAI's returned `input_tokens` and `output_tokens`, including repair calls, curriculum extraction, and search. Output tokens include reasoning tokens when the provider reports them. Counters also update for failed application responses when the provider already returned usage. If a timeout, rejected call, or other response has no usage data, the UI marks the totals as incomplete.

Counters reset on refresh, removal, or key replacement. A late response from a previous key does not affect the replacement key's counter. Cached curriculum results make no paid call and add no usage. The display is not an account balance, billing statement, cost estimate, or spending cap. Tool/search charges and unreported calls may not appear in token totals. The settings link opens OpenAI's own usage dashboard.

The API applies in-process limits of 12 provider attempts per minute and two simultaneous calls per key, with six active provider calls across the process. Repairs count as attempts. These are best-effort instance limits, not distributed quotas across autoscaled instances or provider spending caps.

## Deployment and retirement of the owner's key

1. Start the portable Docker setup in [Standalone setup](STANDALONE.md). A GitHub branch or pull request alone does not change the running app.
2. Remove the old OpenAI AI integration from the Replit project if provisioned there. Remove unused owner AI key environment secrets. Revoke any separately issued owner key in its provider dashboard. Removing code references alone does not revoke a credential.
3. Set `BYOK_MODEL` only if needed; the direct OpenAI default is `gpt-5-mini`. The older Replit `AI_MODEL` alias is intentionally ignored. A visitor's account must have access to the selected model, Responses API, structured output, and the web-search tool if using source discovery.
4. Keep `DATABASE_URL`, `PORT`, and any private storage setup. Never place visitor keys in deployment secrets.
5. With the old integration removed, confirm a missing key makes `/api/generate` return a key-required error and does not issue a provider call. Test direct generation with your own key and verify usage in OpenAI's dashboard.

The GitHub integration cannot inspect or revoke Replit/provider credentials. Those deployment actions remain an operator task until access to that host/provider is supplied.

## Shared data and private curriculum

An API key pays for AI requests; it is not a login and does not establish record ownership. The existing database is one shared teacher workspace. Visitors with access to the app can view and modify its shared classroom records. This conversion does not add per-user accounts or tenant isolation. Use host-level sign-in for a real private workspace; a public demo should contain only appropriate sample data.

Private curriculum management, PDF retrieval, and historical private excerpts stay disabled/redacted by default. Only after the hosting layer actually enforces sign-in may the operator set `DEPLOYMENT_ACCESS_PROTECTED=true`. That variable is an assertion about external protection, not authentication itself. Never set it on an unprotected public deployment. `PDF_STORAGE_DIR` remains required for PDF uploads. Curriculum AI operations use the visitor's key too.

## Verification

API tests reject external fetches by default and use synthetic provider responses. Tests cover no owner fallback, fixed destination, concurrent-key isolation, returned usage across repairs, partial/unreported usage, safe errors, and private-document gating. Browser tests use synthetic classroom and provider fixtures; no real key or paid request is needed for automated QA.
