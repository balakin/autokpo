## Why

The current signed-out entry page is functional but visually raw compared with the signed-in application shell. Redesigning it now gives the authentication flow the same trustworthy, local-first product quality as the rest of AutoKPO while keeping the existing sign-in logic unchanged.

## What Changes

- Redesign `/sign-in` and `/sign-in/code` as polished responsive entry pages that follow the signed-in app's arctic design system.
- Extract `AuthShell` as a shared page wrapper (gradient + grid background, header with locale and theme selectors) used by both auth pages.
- Keep the existing Google OAuth, GitHub OAuth, and email OTP behavior unchanged.
- Present Google first, GitHub second, then email OTP separated by an `or` divider.
- Move language and theme controls into a compact top-right page header instead of leaving them as plain form fields inside the sign-in card.
- Use Serbian Latin as the source language for all new UI copy.
- Use `react-icons/fa6` icons (`FaGoogle`, `FaGithub`) for OAuth buttons as a narrow exception to the Lucide-only icon rule; all other app icons remain Lucide icons.
- Add email address masking on the `/sign-in/code` page for privacy.
- Relax lingui `failOnMissing` to production builds only so the dev server tolerates missing translations.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `user-auth`: The auth entry page layout and presentation changes while preserving available sign-in methods and interactions.
- `i18n`: The auth page locale/theme controls are refined into compact header-level controls and all new strings remain localized.
- `theme-preference`: The auth page theme selector remains available while moving into the redesigned header composition.
- `icon-system`: OAuth provider buttons use `react-icons/fa6` (`FaGoogle`, `FaGithub`) as a narrow exception to the Lucide-only icon rule.

## Impact

- Affects `apps/app/src/auth/auth-entry.tsx`, `email-auth-page.tsx`, `email-otp-sign-in.tsx`, and `email-form.tsx`.
- Adds `apps/app/src/auth/auth-shell.tsx` as a shared page wrapper.
- Updates `apps/app/vite.config.ts` to relax lingui `failOnMissing` to production-only.
- Requires updating auth entry and email auth tests for accessible labels and preserved behavior.
- Requires `pnpm -s i18n:extract` and completed translations for `sr-Latn`, `en`, and `ru` after implementation adds copy.
