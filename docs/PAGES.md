# Public GitHub Pages site

[Open the public demo](https://whatifqu3stion.github.io/classroom-spark/).

GitHub Pages serves the public Boardwork front page and its screenshot tour. It does not run the Express API, PostgreSQL, private curriculum storage, or AI generation. Until a workspace is hosted, the banner identifies this as a screenshot tour, the hero invites visitors to explore the screenshots, and setup links lead to the workspace setup guide.

The landing page introduces current capabilities through everyday teaching needs: preparing a task, keeping directions visible, gathering Homebase tools, reusing activities, and retaining teaching context. AI requirements and shared-workspace access limits live in the FAQs. The page makes no claim that hosted teacher accounts, student submissions, or automatic assessment are available.

## Connect the front page to the app

1. Deploy the full app and database using [the standalone guide](STANDALONE.md) or [the Render guide](RENDER.md), including access protection for the shared teacher workspace.
2. Verify that its HTTPS workspace address (including `/app`, for example `https://boardwork.example.com/app`) opens the editable app.
3. Set the GitHub Actions repository variable `BOARDWORK_WORKSPACE_URL` to that complete address. This is a public link, not a secret.
4. Ensure the workflow on `main` includes the `VITE_WORKSPACE_URL: ${{ vars.BOARDWORK_WORKSPACE_URL }}` build environment entry, then run it again. The banner and all launch buttons will link directly to the hosted workspace. Updating the feature branch alone does not update the workflow that runs from `main`.

Use the complete URL, including any deployment path prefix. Only HTTPS addresses without embedded credentials are accepted. An empty or invalid value keeps the setup links. The normal app build continues to open its own `/app` route regardless of this setting. Setting a link does not deploy the server or database.

## Build and publish

The `VITE_PUBLIC_SITE=true` build keeps navigation on the public tour; the normal application build retains the workspace routes. `BASE_PATH` must match the repository Pages path, including a trailing slash. Product images and fonts use that base path.

The Pages workflow lives on `main` and builds `feat/classroom-homebase`, the current working application branch, while the feature pull requests are under review. A push to `main` or a manual workflow run publishes the latest front page from that branch. Change the checkout ref to `main` after the application work is merged and before deleting the feature branch.

To check the public build locally:

```sh
BASE_PATH=/classroom-spark/ VITE_PUBLIC_SITE=true pnpm --filter @workspace/boardwork run build
```

The deployment workflow uses GitHub's Pages artifact and deployment actions. Pages is configured to deploy through GitHub Actions. The full workspace can be hosted separately using [the standalone guide](STANDALONE.md).
