## 1. Theme Infrastructure

- [x] 1.1 Create `src/settings/theme-context.ts` — export `Theme` type (`'light' | 'dark' | 'system'`) and `ThemeContext`
- [x] 1.2 Create `src/settings/theme-provider.tsx` — `ThemeProvider` component that reads/writes `localStorage['kpo:theme']`, applies class/attribute/colorScheme to `<html>`, and listens for OS changes when preference is `'system'`
- [x] 1.3 Create `src/settings/use-theme.ts` — `useTheme` hook wrapping `useContext(ThemeContext)`

## 2. FOUC Prevention

- [x] 2.1 Add inline script to `index.html` `<head>` that reads `localStorage['kpo:theme']`, resolves the theme, and sets `class`, `data-theme`, and `style.colorScheme` on `<html>` synchronously before React renders

## 3. Wire ThemeProvider

- [x] 3.1 In `src/main.tsx`, import `ThemeProvider` from `./settings/theme-provider` and wrap the existing app tree with `<ThemeProvider>`

## 4. Settings Page — Theme Select

- [x] 4.1 In `src/settings/settings-page.tsx`, import `useTheme` from `./use-theme` and HeroUI `Select`, `ListBox` components
- [x] 4.2 Replace the three disabled `Button` elements in the Theme `Card.Content` with a controlled HeroUI `Select` with three options: `"light"` → "Svetla", `"dark"` → "Tamna", `"system"` → "Sistemska"; wire `value` to `theme` and `onChange` to `setTheme` from `useTheme()`

## 5. Tests

- [x] 5.1 Write RTL test for `SettingsPage` verifying the theme Select renders with "Sistemska" selected by default and that selecting an option calls `setTheme` (mock `./use-theme`)

## 6. Verify

- [x] 6.1 Run `pnpm build` — no type errors
- [x] 6.2 Run full test suite — all tests pass
- [x] 6.3 Run `pnpm lint:fix` and confirm no remaining lint errors
