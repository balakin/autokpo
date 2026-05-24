## Context

The auth shell (`auth-shell.tsx`) currently renders two inline `<Select>` components (language and theme) in its header. On mobile, these stack above the logo, adding visual noise to an already narrow viewport. The encryption shell (`encryption-shell.tsx`) uses a cleaner pattern: a single avatar button that opens a `Popover` on desktop or a `Drawer` on mobile, keeping the header minimal with `flex items-center justify-between` spacing. The `EncryptionProfilePopover` component demonstrates this pattern, including the mobile/desktop switch via `useIsMobile()`.

The social sign-in buttons in `auth-entry.tsx` use `flex gap-2` (always horizontal), making them cramped on mobile (each button gets ~168px on a 360px viewport).

The codebase already has the `useIsMobile()` hook, `LOCALE_NAMES`/`LOCALES` constants, `useLocale()`, and `useTheme()` hooks — all available for reuse.

## Goals / Non-Goals

**Goals:**

- Clean up the auth shell header to match the encryption shell header layout (logo left, single action button right, `justify-between`)
- Replace inline selects with a gear-button-triggered Popover (desktop) / Drawer (mobile)
- Show language and theme selects with visible labels inside the popover/drawer
- Stack social OAuth buttons vertically on mobile for better tap targets
- Follow existing codebase patterns (separate component file, `useIsMobile` toggle, HeroUI compound component API)

**Non-Goals:**

- Changing the theme or locale storage/persistence behavior
- Adding profile section, sign-out, or any user-identity features (auth shell = signed-out state)
- Modifying `oauth-callback.tsx` (transient page, doesn't use `AuthShell`)
- Changing the signed-in app shell or its settings pages

## Decisions

### Decision 1: Separate component file (`auth-preferences-popover.tsx`)

**Chosen**: New file in `src/auth/`, imported by `auth-shell.tsx`.

**Rationale**: The existing pattern is consistent — `EncryptionProfilePopover` in `src/e2ee/` and `ProfilePopover` in `src/auth/` are both separate files imported by their respective shells. A separate file keeps `auth-shell.tsx` lean (~60 lines after cleanup vs current 119) and allows the popover to be tested in isolation.

**Alternatives**: Inline the popover inside `auth-shell.tsx`. Rejected — adds ~80 lines to the shell and breaks the established pattern.

### Decision 2: Popover on desktop, Drawer on mobile via `useIsMobile()`

**Chosen**: Identical pattern to `EncryptionProfilePopover` — render `<Popover>` when `!isMobile`, render `<Drawer>` when `isMobile`.

**Rationale**: This pattern is proven in two existing components (`EncryptionProfilePopover`, `ProfilePopover`). It gives desktop users a compact floating panel and mobile users a full-screen drawer from the right edge. The `useIsMobile` hook reads `--breakpoint-lg` from the Tailwind CSS variable, matching the app-wide responsive breakpoint convention.

### Decision 3: Visible labels in the popover (not `sr-only`)

**Chosen**: `<Label>{t`Jezik`}</Label>` and `<Label>{t`Tema`}</Label>` — visible labels, matching `EncryptionProfilePopover`.

**Rationale**: The popover/drawer has enough space for visible labels. The `sr-only` labels in the current inline header layout were a space-constrained workaround. The encryption shell popover already uses visible labels — consistency is valuable.

### Decision 4: Popover width `w-60`

**Chosen**: `w-60` for the desktop popover.

**Rationale**: `EncryptionProfilePopover` uses `w-72` because it has profile info + select stack + sign-out button. The auth preferences popover has only two selects — `w-60` (240px) is sufficient and not overly wide.

### Decision 5: Header layout matches encryption shell exactly

**Chosen**:

```
<header className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <span className="text-2xl font-bold tracking-tight">AutoKPO</span>
  </div>
  <div className="flex items-center justify-end">
    <AuthPreferencesPopover />
  </div>
</header>
```

**Rationale**: This is identical to `encryption-shell.tsx:24-32`. Both shells should look the same structurally — the only difference is which popover component appears on the right.

### Decision 6: Social buttons use Tailwind responsive classes

**Chosen**: `<div className="flex flex-col gap-2 sm:flex-row">` in `auth-entry.tsx`.

**Rationale**: No JavaScript needed — pure CSS responsive breakpoint. At `sm:` and above (640px), buttons render side-by-side. Below `sm:`, they stack vertically with `fullWidth` giving each the full card width. This is the simplest possible change (one class string edit).

### Decision 7: No barrel export needed

**Chosen**: `AuthPreferencesPopover` is imported directly by `auth-shell.tsx` — no addition to `src/auth/index.ts`.

**Rationale**: The component is an internal implementation detail of the auth shell, not part of the auth module's public API. `EncryptionProfilePopover` is not re-exported either.

## Risks / Trade-offs

**[Risk] Mobile drawer close button inconsistent with encryption shell** — `EncryptionProfilePopover` uses `slot="close"` on a `<Button>` inside `Drawer.Dialog`. We must replicate this exactly to get the same behavior.

→ **Mitigation**: Copy the drawer structure from `EncryptionProfilePopover` lines 161-188 verbatim, replacing only the heading text and body content.

**[Risk] Auth shell test snap broken** — The existing test (`auth-shell.spec.tsx`) only asserts AGPL notice and source link. It does not test the selects.

→ **Mitigation**: Minimal test impact. The gear button rendering can be verified if desired, but the existing assertions are unaffected.

**[Trade-off] Two components doing similar things** — `EncryptionProfilePopover`, `ProfilePopover`, and now `AuthPreferencesPopover` all implement the same Popover/Drawer toggle pattern.

→ **Justification**: They serve different contexts with different content (signed-out prefs vs encryption shell profile vs app shell profile). Extracting a generic `PopoverDrawer` wrapper would be premature — the three components share a pattern but not enough DNA to abstract yet.
