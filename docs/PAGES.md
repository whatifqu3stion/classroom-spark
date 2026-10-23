# Public GitHub Pages site

GitHub Pages serves the public Boardwork front page and its screenshot tour. It does not run the Express API, PostgreSQL, private curriculum storage, or AI generation. Public-site buttons point to the repository and the page identifies itself as a product preview.

The `VITE_PUBLIC_SITE=true` build keeps navigation on the public tour; the normal application build retains the workspace routes. `BASE_PATH` must match the repository Pages path, including a trailing slash. Product images and fonts use that base path.

The Pages workflow lives on `main` and builds `feat/classroom-homebase`, the current working application branch, while the feature pull requests are under review. A push to `main` or a manual workflow run publishes the latest front page from that branch. Change the checkout ref to `main` after the application work is merged and before deleting the feature branch.

To check the public build locally:

```sh
BASE_PATH=/classroom-spark/ VITE_PUBLIC_SITE=true pnpm --filter @workspace/boardwork run build
```

The deployment workflow uses GitHub's Pages artifact and deployment actions. Pages is configured to deploy through GitHub Actions. The full workspace can be hosted separately using [the standalone guide](STANDALONE.md).
