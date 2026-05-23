## Why

The auth shell header is cluttered on mobile — two inline select dropdowns stack above the logo, and social sign-in buttons are cramped side-by-side on narrow viewports. The signed-in app already has a clean pattern (popover on desktop, drawer on mobile via a single gear icon) for preferences; the auth shell should match that aesthetic and responsive behavior. Additionally, the header layout diverges from the encryption shell, which uses `justify-between` for consistent spacing.

## What Changes

- Social OAuth buttons (Google, GitHub) stack vertically on mobile instead of staying cramped in a row
- Replace the two inline `<Select>` controls (language + theme) in the auth shell header with a single gear icon button (`LuSettings`)
- The gear button opens a `Popover` on desktop and a `Drawer` on mobile, following the same pattern used by `EncryptionProfilePopover`
- The popover/drawer contains the language and theme selects with visible labels (not `sr-only`), matching the encryption shell style
- Auth shell header layout changes to `flex items-center justify-between`, matching the encryption shell header structure
- New `AuthPreferencesPopover` component encapsulates this behavior

## Capabilities

### New Capabilities

- `auth-preferences-popover`: A popover/drawer component for the auth (signed-out) shell that provides language and theme selection through a gear icon button trigger

### Modified Capabilities

- `theme-preference`: The auth page compact theme control requirement changes from inline `<Select>` dropdowns in the header to a gear-button-triggered popover/drawer

## Impact

- `src/auth/auth-shell.tsx` — remove inline selects, import new component, simplify header layout
- `src/auth/auth-preferences-popover.tsx` — new component (gear button, Popover/Drawer with locale + theme selects)
- `src/auth/auth-entry.tsx` — social buttons container class change
- `src/auth/index.ts` — export new component if needed
- `src/auth/__tests__/auth-shell.spec.tsx` — update tests for new header structure
