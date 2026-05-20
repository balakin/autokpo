## 1. Sidebar footer

- [ ] 1.1 Replace the version footer layout in `sidebar.tsx` with `flex justify-between items-center` — version badge on the left, `LuCircleHelp` icon-only ghost button on the right
- [ ] 1.2 Remove the AGPL notice block from `sidebar.tsx`
- [ ] 1.3 Wire the "?" button to navigate to `/help` (via React Router `Link` or `useNavigate`)
- [ ] 1.4 Add aria-label to the "?" button using `t` macro

## 2. Routing

- [ ] 2.1 Add lazy `HelpPage` export to `route-lazy-components.tsx`
- [ ] 2.2 Add `/help` route to `app-routes.tsx` inside the signed-in route tree
- [ ] 2.3 Add `"Pomoć"` breadcrumb case in `useBreadcrumbs` in `top-bar.tsx`

## 3. Help page component

- [ ] 3.1 Create `src/help/help-page.tsx` with all six sections: O projektu, Kako prijaviti problem, Zakonski propisi, Doprinesite projektu, Autori, Licenca
- [ ] 3.2 Wrap all strings with `<Trans>` / `t` macros (source locale: sr-Latn)
- [ ] 3.3 Ensure all external links have `target="_blank"` and `rel="noopener noreferrer"`

## 4. i18n

- [ ] 4.1 Run `pnpm -s i18n:extract` to update `.po` files
- [ ] 4.2 Fill in English (`en`) translations for all new strings
- [ ] 4.3 Fill in Russian (`ru`) translations for all new strings

## 5. Tests

- [ ] 5.1 Update `app-shell.spec.tsx` — assert AGPL notice is no longer in the sidebar, assert "?" button is present and links to `/help`
- [ ] 5.2 Add `help-page.spec.tsx` — render `HelpPage` and assert all six sections are present and key links have correct `href` values
