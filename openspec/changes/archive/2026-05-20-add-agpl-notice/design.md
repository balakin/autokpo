## Context

AutoKPO is AGPL-3.0 licensed. The license requires that users of a network-deployed service be offered access to the corresponding source code. The UI currently has no mention of this. The app has two persistent shells: `AuthShell` (unauthenticated) and the main app shell with `Sidebar` (authenticated). Both need a notice.

## Goals / Non-Goals

**Goals:**

- Display a minimal AGPL-3.0 + source link in both `AuthShell` and `Sidebar`
- Keep the notice unobtrusive — small, muted, low visual weight
- Translate the notice text via the existing i18n system (Lingui)

**Non-Goals:**

- A full "About" page or legal disclaimer page
- Attribution notices for third-party dependencies
- Any modal or dismissible banner

## Decisions

### Source URL as a Vite environment variable

The source repo URL will be exposed as `VITE_SOURCE_URL` in the Vite env, declared in `vite-env.d.ts` (`ImportMetaEnv`), and documented in `.env.example`. This lets forks point to their own repo without touching source code.

`import.meta.env.VITE_SOURCE_URL` is referenced directly at the two call sites — no intermediate constant needed.

_Alternative considered_: hardcode in `constants.ts` — rejected because forks would need a code change rather than an env var to update the URL.

### Placement

- **`AuthShell`**: Add a `<footer>` below the existing `<main>`. A single centered line with muted text + external link. The auth shell already has header/main structure; footer is the natural third slot.
- **`Sidebar`**: Add notice between the stats footer and the version badge section, or inline with the version badge row. The version badge block at the bottom is already a "meta" area — the notice fits naturally there.

### No new shared component

The notice is two lines of JSX each. Extracting a shared component adds indirection with minimal benefit at this scale.

_Alternative considered_: `<AgplNotice />` component — rejected as over-engineering for what is effectively a single `<a>` tag.

### i18n

Use `<Trans>` macro from Lingui. The link label ("Source code" / "Izvorni kod" / "Исходный код") will go through the standard translation pipeline.

## Risks / Trade-offs

- [`VITE_SOURCE_URL` not set] → The link `href` will be `undefined`; the notice should either hide the link or fall back gracefully. Simplest mitigation: render the notice only when the env var is set.
- [Notice may be missed by users] → AGPL requires the offer to be "prominent" but not intrusive; placement in persistent UI areas satisfies this.
