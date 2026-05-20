## Context

The app-shell sidebar has three issues to fix:

1. Inline `style` props use raw CSS variable strings instead of Tailwind utility classes, even though the sidebar tokens are already registered in `@theme inline`.
2. Clicking a nav link inside the mobile drawer does not close it.
3. Widening the viewport past `lg` leaves the drawer open in a broken half-visible state.

Affected files: `sidebar.tsx`, `mobile-drawer.tsx`, `app-shell.tsx`, `index.css`.

## Goals / Non-Goals

**Goals:**

- Replace all inline `style` props in sidebar components with Tailwind utility classes.
- Remove `.sidebar-nav-item` / `.sidebar-nav-item--active` CSS rules; express all states as Tailwind utilities on the `<Link>` element.
- Close the mobile drawer when the user taps a nav link.
- Close the mobile drawer automatically when the viewport grows past the `lg` breakpoint.

**Non-Goals:**

- Changing sidebar visual appearance or design tokens.
- Changing the drawer animation, placement, or HeroUI Drawer props.

## Decisions

### 1. Tailwind classes over inline styles

The sidebar tokens (`--sidebar-bg`, `--sidebar-fg`, etc.) are already registered under `@theme inline` as `--color-sidebar-bg`, etc., making them available as `bg-sidebar-bg`, `text-sidebar-fg`, `border-sidebar-border`, and so on. Replace every `style={{ … }}` with the matching utility class.

For the nav item hover/active states, use Tailwind's `hover:` and `focus-visible:` variants directly on the `<Link>` className string, removing the external CSS rules entirely.

### 2. Close drawer on navigate — `onNavigate` prop

Add an optional `onNavigate?: () => void` prop to `<Sidebar>`. Each nav `<Link>` calls `onNavigate?.()` via an `onClick` handler. `<MobileDrawer>` passes `() => onOpenChange(false)` as `onNavigate`; the desktop `<Sidebar>` (rendered in `<AppShell>`) passes nothing.

Alternatives considered:

- Using `useEffect` + `useLocation` to watch route changes: works but adds an effect dependency and fires slightly later than a direct click handler.
- Using React Router's `<NavLink>` `onClick`: same as the chosen approach; we already use `<Link>`, so a plain `onClick` prop is simpler.

### 3. Close drawer on resize — `matchMedia` tied to Tailwind breakpoint

In `AppShell`, a single `useEffect` registers a `MediaQueryList` change listener:

```ts
useEffect(() => {
  const lg = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-lg')
    .trim(); // reads Tailwind v4 CSS variable, e.g. "1024px"
  const mql = window.matchMedia(`(min-width: ${lg})`);
  const handler = (e: MediaQueryListEvent) => {
    if (e.matches) setIsMobileDrawerOpen(false);
  };
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}, []);
```

Reading `--breakpoint-lg` from `getComputedStyle` keeps the media query in sync with Tailwind's token; if the breakpoint is ever overridden in CSS, the listener updates automatically without touching JS.

Alternatives considered:

- Hardcoding `1024px`: works today, silently breaks on a breakpoint change.
- `ResizeObserver` on the root element: heavier, fires on every pixel change instead of once at the threshold.

## Risks / Trade-offs

- `getComputedStyle` runs once at mount. If the `--breakpoint-lg` variable is set after the first paint (unlikely), it would read the wrong value. → Not a concern for this project; tokens are on `:root` from the initial CSS parse.
- Removing CSS class names (`sidebar-nav-item`) is a breaking change for any external selector targeting those classes. → No external consumers in this codebase; safe to remove.
