## Context

HeroUI themes are applied by setting `class="light"` / `class="dark"` and `data-theme="light"` / `data-theme="dark"` on the `<html>` element. The app currently has a static Settings page with disabled theme buttons. The theme must also initialise before React hydrates to prevent a flash of the wrong theme (FOUC).

## Goals / Non-Goals

**Goals:**

- Functional theme Select (light / dark / system) in the Settings page
- Persist preference to `localStorage`
- Apply the correct HeroUI theme class to `<html>` on first load and on change
- "System" resolves via `prefers-color-scheme` and reacts to OS changes in real time
- Default preference is `"system"`

**Non-Goals:**

- Animated theme transitions
- Per-book theme overrides
- Custom theme authoring

## Decisions

### 1. Custom `ThemeProvider` instead of `next-themes`

A lightweight custom implementation was chosen over the `next-themes` library:

- `src/settings/theme-context.ts` — `Theme` type (`'light' | 'dark' | 'system'`) and `ThemeContext`
- `src/settings/theme-provider.tsx` — reads/writes `localStorage['kpo:theme']`, calls `applyToDOM` on change, and attaches a `matchMedia` listener when preference is `'system'`
- `src/settings/use-theme.ts` — thin `useContext(ThemeContext)` wrapper
- Inline script in `index.html` `<head>` — reads localStorage and applies class/attribute synchronously before JS execution to prevent FOUC

_Alternative considered_: `next-themes` library. Rejected — adds an external dependency for behaviour that is straightforward to implement with ~50 lines and no peer-dep constraints.

### 2. `ThemeProvider` wraps the app in `main.tsx`

```tsx
<ThemeProvider>{/* existing app tree */}</ThemeProvider>
```

`ThemeProvider` initialises from `localStorage` on mount, calls `applyToDOM` which sets `class`, `data-theme`, and `colorScheme` on `<html>`. First-time visitors default to `"system"`.

### 3. `data-theme` attribute and `colorScheme`

`applyToDOM` sets both `class` and `data-theme` attributes (HeroUI reads both) plus `style.colorScheme` for browser chrome integration.

### 4. HeroUI `Select` component for the picker

The HeroUI v3 `Select` (controlled, single-selection) wired to `useTheme`. Placed inside the existing `Card.Content` for the Theme section, replacing the three disabled `Button` elements.

## Risks / Trade-offs

- **No SSR concerns**: This app is a Vite SPA — no hydration mismatch risk.
- **FOUC prevention**: The inline script in `index.html` runs before the bundle, so no flash occurs even on cold loads.
