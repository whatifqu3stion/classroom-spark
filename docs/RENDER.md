# Boardwork on Render

The root [render.yaml](../render.yaml) prepares one Docker web service, managed PostgreSQL, and persistent PDF storage. The existing Docker image serves the frontend and API together and runs database migrations before listening. No separate static site or migration command is needed.

This is a deployment proposal, not a completed deployment. Importing it creates paid resources. Review Render's displayed charges before applying it. The proposed initial sizes are 0.5 CPU / 512 MB for the app, 0.1 CPU / 256 MB for Postgres, 1 GB database storage, and 1 GB PDF storage in Oregon. These are starting sizes, not load-tested capacity guarantees.

## Access before launch

Boardwork currently has one shared workspace and no teacher sign-in or per-user isolation. The Blueprint starts with public traffic disabled through maintenance mode. This allows provisioning without exposing workspace editing. Maintenance mode is a temporary launch gate, not authentication.

Before opening the workspace, configure enforced sign-in covering both the app and `/api` on every reachable hostname. If protection is attached only to a custom domain, disable the default Render subdomain and verify there is no bypass. Only after verifying protection should `DEPLOYMENT_ACCESS_PROTECTED` become `true` and `maintenanceMode.enabled` become `false`. That environment variable enables private curriculum features; it does not add authentication. Make these changes in the Blueprint as well as any dashboard setup so subsequent syncs preserve them.

## Connect and deploy

1. Connect Render's MCP using [Render's official instructions](https://render.com/docs/mcp-server), then select the intended Render workspace. Confirm existing services before creating anything to avoid duplicates. The MCP connection and GitHub repository access are separate permissions.
2. Commit and push the reviewed application fixes and deployment files. Render builds GitHub commits, so local uncommitted changes are not included. Create a Blueprint from `whatifqu3stion/classroom-spark` using the branch containing those changes (currently `feat/classroom-homebase`). The web service inherits the Blueprint branch.
3. Review the two resource names, region, sizes, storage, and charges. Apply only after approving the proposal. Database credentials are referenced internally by the Blueprint; no credentials or owner OpenAI key belong in the repository.
4. Inspect build and startup logs. Confirm migrations finish and `/api/readyz` succeeds from inside the running service. While maintenance mode is on, public requests intentionally return the maintenance page. Automatic commit deployments are off; the initial Blueprint creation still deploys.
5. From the Render service shell, verify the non-root runtime can create and remove a temporary file under `/data/pdfs`. Do not enable PDF imports until the mounted disk is writable. Container startup and mounted-volume permissions still need live verification.
6. Complete the access setup above and test an authenticated browser session. Create a class, save and reopen a board, edit Homebase, and refresh. After a restart, confirm those records persist. Once curriculum is enabled, import a disposable PDF and confirm it also survives a restart. Exercise AI generation with a visitor-provided key; a successful build alone does not verify external AI calls.
7. Set the GitHub repository variable `BOARDWORK_WORKSPACE_URL` to the protected HTTPS address including `/app`, then publish the updated Pages workflow as described in [PAGES.md](PAGES.md). Test every public launch button.

## Operations and verification

The app uses the internal database connection and blocks external Postgres connections. PDFs live under `/data/pdfs` on the disk mounted at `/data`. Keep a single app instance with this local storage design; plan for a short interruption during disk-backed redeployments. Track database and PDF capacity separately and retain backups of both.

The local configuration can be checked against [Render's Blueprint schema](https://render.com/schema/render.yaml.json). Live Docker deployment, database migration, access protection, mounted storage, and paid-plan capacity require verification in the selected Render workspace. See [STANDALONE.md](STANDALONE.md) for the application's runtime contract and existing Docker smoke checks.

Provider references: [Blueprint fields](https://render.com/docs/blueprint-spec), [persistent disks](https://render.com/docs/disks), [maintenance mode](https://render.com/docs/maintenance-mode), and [current pricing](https://render.com/pricing).
