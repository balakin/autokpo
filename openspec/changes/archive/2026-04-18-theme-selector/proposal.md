## Why

The Settings page currently has a static theme placeholder with no functionality. Users need a working light/dark/system theme selector that persists their preference across sessions.

## What Changes

- Add a custom `ThemeProvider` (`src/settings/theme-provider.tsx`) that handles localStorage persistence, system detection, FOUC prevention via an inline script in `index.html`, and class/attribute application to `<html>`
- Expose theme state via a `ThemeContext` (`src/settings/theme-context.ts`) and `useTheme` hook (`src/settings/use-theme.ts`)
- Wrap the app in `ThemeProvider` in `src/main.tsx`
- Replace the disabled theme buttons in `SettingsPage` with a functional HeroUI `Select` component wired to `useTheme`

## Capabilities

### New Capabilities

- `theme-preference`: Theme selection UI and persistence — lets users choose light, dark, or system theme; stores choice in `localStorage`; applies the correct HeroUI theme class to `<html>` on load and on change

### Modified Capabilities

- `settings`: Theme section changes from a placeholder with disabled buttons to a live, functional Select control

## Impact

- `index.html` — inline script in `<head>` applies the correct class/attribute before React renders (FOUC prevention)
- `src/settings/theme-context.ts` — `Theme` type and `ThemeContext`
- `src/settings/theme-provider.tsx` — `ThemeProvider` component with localStorage persistence and `matchMedia` listener
- `src/settings/use-theme.ts` — `useTheme` hook
- `src/main.tsx` — wrap app with `<ThemeProvider>`
- `src/settings/settings-page.tsx` — replace disabled buttons with a HeroUI `Select` using `useTheme`
- No new npm dependencies
