## 1. Sidebar footer

- [x] 1.1 Replace version footer layout in `sidebar.tsx` with `flex justify-between items-center` — version badge on the left, `AGPL-3.0 · [LuGithub icon]` no-underline link on the right
- [x] 1.2 Remove the standalone AGPL notice block (with "Izvorni kod" label) from `sidebar.tsx`
- [x] 1.3 Add "Pomoć" nav item (icon: LuCircleHelp, route: /help) anchored below main nav items via `mt-auto`

## 2. Routing

- [x] 2.1 Add lazy `HelpPage` export to `route-lazy-components.tsx`
- [x] 2.2 Add `/help` route to `app-routes.tsx` inside the signed-in route tree
- [x] 2.3 Add `"Pomoć"` breadcrumb case in `useBreadcrumbs` in `top-bar.tsx`

## 3. Help page component

- [x] 3.1 Create `src/help/help-page.tsx` with six Card-based sections laid out as: full-width "O projektu", 2-col grid (Kako prijaviti + Zakonski propisi), 3-col grid (Doprinesite + Autori + Licenca)
- [x] 3.2 Zakonski propisi card: each law link with article reference subtitle below
- [x] 3.3 Autori card: Dmitrii Balakin link with "Osnivač projekta" subtitle; Svi doprinosioci link without subtitle
- [x] 3.4 Licenca card: AGPL-3.0 link with "GNU Affero General Public License v3.0" subtitle
- [x] 3.5 Wrap all strings with `<Trans>` / `t` macros (source locale: sr-Latn)
- [x] 3.6 Ensure all external links have `target="_blank"` and `rel="noopener noreferrer"`

## 4. i18n

- [x] 4.1 Run `pnpm -s i18n:extract` to update `.po` files
- [x] 4.2 Fill in English (`en`) translations for all new strings
- [x] 4.3 Fill in Russian (`ru`) translations for all new strings

## 5. Tests

- [x] 5.1 Update `app-shell.spec.tsx` — assert Pomoć nav link is present, assert AGPL-3.0 GitHub link is in the footer
- [x] 5.2 Add `help-page.spec.tsx` — render `HelpPage` and assert all six sections, key links, and correct href values

## 6. Remove VITE_SOURCE_URL

- [x] 6.1 Remove startup check from `main.tsx`
- [x] 6.2 Replace `import.meta.env.VITE_SOURCE_URL` in `sidebar.tsx` with hardcoded URL
- [x] 6.3 Replace `import.meta.env.VITE_SOURCE_URL` in `auth-shell.tsx` with hardcoded URL
- [x] 6.4 Replace two `import.meta.env.VITE_SOURCE_URL` usages in `help-page.tsx` with `GITHUB_REPO` constant
- [x] 6.5 Remove `VITE_SOURCE_URL` from `vite-env.d.ts`
- [x] 6.6 Remove `VITE_SOURCE_URL` from `.env` and `.env.example`
- [x] 6.7 Update tests — remove `vi.stubEnv('VITE_SOURCE_URL', ...)` from `app-shell.spec.tsx`, `auth-shell.spec.tsx`, and `help-page.spec.tsx`
