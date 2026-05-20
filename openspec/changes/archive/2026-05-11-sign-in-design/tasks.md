## 1. Assets And Structure

- [x] 1.1 Add `react-icons/fa6` icons (`FaGoogle`, `FaGithub`) for OAuth buttons as a narrow exception to the Lucide-only rule.
- [x] 1.2 Extract `AuthShell` as a shared page wrapper (`auth-shell.tsx`) with gradient/grid background and header controls.

## 2. Auth Page Composition

- [x] 2.1 Rework `AuthEntry` to use `AuthShell` (background, header) with a centered sign-in card.
- [x] 2.2 Move locale and theme controls into compact header-level controls while preserving `setLocale` and `setTheme` behavior.
- [x] 2.3 Render OAuth actions with Google first, GitHub second, official decorative brand marks, and unchanged `startOAuthFlow` calls.
- [x] 2.4 Add an `or` divider between OAuth actions and email OTP sign-in.
- [x] 2.5 Integrate the existing email OTP form in the redesigned card without changing submit/navigation behavior.
- [x] 2.6 Redesign `/sign-in/code` (`email-auth-page.tsx`) to use `AuthShell` for visual consistency with `/sign-in`, including email masking.
- [x] 2.7 Relax lingui `failOnMissing` to production-only in `vite.config.ts` so the dev server tolerates gaps during translation work.

## 3. Localization And Tests

- [x] 3.1 Wrap all new auth page user-visible strings with Lingui macros using Serbian Latin source text.
- [x] 3.2 Update auth entry tests to verify Google, GitHub, and email OTP behavior still works with the new accessible labels/composition.
- [x] 3.3 Add or update assertions for header-level locale/theme controls and OAuth/email separation where practical.
- [x] 3.4 Run `pnpm -s i18n:extract` in `apps/app` and fill `en` and `ru` translations for new strings.

## 4. Verification

- [x] 4.1 Run targeted auth entry tests with Vitest verbose reporter.
- [x] 4.2 Run scoped ESLint/Prettier checks for changed app files.
- [x] 4.3 Run app build or targeted typecheck to confirm HeroUI, react-icons, and i18n changes compile.
