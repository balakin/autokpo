# Astro Starter Kit: Basics

```sh
pnpm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 🚀 Deployment

Deployment is automated. Cutting a release with Changesets creates an `@autokpo/website@<version>` git tag, which triggers the **Deploy Website** GitHub Actions workflow (`.github/workflows/deploy-website.yml`). The workflow installs cleanly (no restored cache), builds the static site, and deploys it with `wrangler deploy` (no D1, no migrations). It runs under the `production` GitHub Environment, which holds `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The workflow sets no `CLOUDFLARE_ENV`, so Wrangler uses this package's single default config. This is intentional: the website has no `env.production` section, so it must **not** receive a `production` environment value (the app's separate workflow is the only one that sets `CLOUDFLARE_ENV`).

**Client-side build variables.** The bundle inlines `PUBLIC_*` variables at **build time**, so they must be present in CI when the workflow builds. They are publishable, so they are stored as GitHub Actions **variables** (`vars`) on the `production` environment, and listed in `turbo.json`'s `build.env` so Turbo's strict mode passes them through:

| Variable                       | Required | Purpose                           |
| ------------------------------ | -------- | --------------------------------- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | no       | PostHog project token (analytics) |
| `PUBLIC_POSTHOG_HOST`          | no       | PostHog ingestion host            |

See [`.env.example`](.env.example) for local development.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
