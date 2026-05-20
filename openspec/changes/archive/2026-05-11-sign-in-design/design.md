## Context

`AuthEntry` currently renders a centered sign-in card with Google, GitHub, email OTP, locale, and theme controls in one stack. The behavior is correct, but the composition does not match the signed-in app's arctic design system, app-level header structure, or product tone.

The redesign should keep authentication logic stable and focus on UI composition. The signed-in app already provides the relevant visual language: Manrope typography, arctic background/surface tokens, restrained borders, soft elevation, HeroUI v3 compound components, Lucide icons, and localized Serbian source strings.

## Goals / Non-Goals

**Goals:**

- Make `/sign-in` feel like part of the same product as the signed-in app.
- Preserve the existing Google OAuth, GitHub OAuth, and email OTP interactions.
- Give OAuth and email sign-in distinct visual sections with Google first.
- Move locale and theme controls into compact top-right header controls.
- Support a responsive single-column layout centered on sign-in actions.
- Keep all new user-visible strings localized with Serbian Latin source copy.
- Allow only OAuth provider brand SVGs as a narrow exception to the Lucide icon system.

**Non-Goals:**

- No changes to Better Auth configuration, OAuth callback routes, OTP behavior, or auth state management.
- No redesign of `/sign-in/code` unless required for consistency by a later change.
- No new icon library dependency.
- No new persisted user preference model.
- No general marketing landing page or public website content.

## Decisions

### Use a single-column centered auth composition

Both auth pages (`/sign-in` and `/sign-in/code`) render inside `AuthShell`: a full-screen page with a gradient/grid background, a header strip for locale and theme selectors, and a centered main area for the sign-in card.

This keeps sign-in actions dominant at all viewport widths and avoids the layout complexity of a side-by-side benefits panel.

Alternative considered: a two-zone layout with a desktop benefits panel. Deferred — the benefits content can be added to `AuthShell` later without structural changes.

### Keep business logic inside existing handlers

`requestOtp`, `startOAuthFlow('google')`, `startOAuthFlow('github')`, `useLocale`, and `useTheme` should remain the source of behavior. The redesign should reorganize JSX and styling, not introduce new auth state.

Alternative considered: extracting a larger auth state/controller component. This adds complexity without changing behavior.

### Use HeroUI controls and app tokens, with custom composition classes

Implementation should continue using HeroUI v3 components already present in the app (`Button`, `Card`, `Select`, `ListBox`, `Label`, `Separator`, `InputGroup`, `TextField`) and Tailwind classes backed by existing design tokens (`bg-background`, `bg-surface`, `border-border`, `text-muted`, `shadow-[var(--surface-shadow)]` where useful).

Alternative considered: building custom primitive controls. This risks accessibility regressions and diverges from the app's component system.

### Preferences are app-level header actions

Locale and theme selectors should render in the top-right page header as compact controls. They should remain accessible through `aria-label` and keep the same `setLocale` / `setTheme` behavior. Visual labels may be omitted or minimized in favor of compact triggers.

Alternative considered: leaving preferences inside the sign-in card. This makes them compete with sign-in actions and reads as part of the auth form rather than page/app preferences.

### OAuth provider icons use react-icons/fa6, decorative and scoped

The OAuth buttons use `FaGoogle` and `FaGithub` from `react-icons/fa6`. Both are rendered with `aria-hidden="true"` so the button text remains the accessible label.

This is a deliberate exception to the Lucide-only icon rule because OAuth providers are brand identities, not general UI icons. Using `react-icons/fa6` is consistent with how the rest of the app imports icons (same package, same pattern) and avoids managing raw SVG assets.

Alternative considered: locally bundled SVG files. This avoids the `fa6` sub-package but requires asset management and custom import wiring.

### Email address is masked on /sign-in/code

The OTP confirmation page shows a masked email (e.g., `d***@example.com`) instead of the full address, balancing context for the user with privacy in public contexts.

The masking is purely presentational — the full address is used for OTP verification.

## Risks / Trade-offs

- react-icons/fa6 diverges from app CLAUDE.md Lucide-only rule -> Accepted as a deliberate exception for OAuth brand identity; scoped strictly to the two OAuth buttons.
- Tests may become brittle if they assert exact button text -> Preserve accessible names where possible or update tests to assert behavior through stable localized labels.
- New localized copy can break build if catalogs are incomplete -> `failOnMissing` relaxed to production-only so dev server tolerates gaps; translations must be complete before shipping.
- Compact selectors may lose clarity -> Use accessible labels and visible selected values so language and theme remain discoverable.
