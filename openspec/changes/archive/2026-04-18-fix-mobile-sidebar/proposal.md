## Why

The mobile sidebar drawer has three defects: inline `style` props bypass Tailwind's design-token system (the tokens are already registered in `@theme inline` but not used), nav link clicks don't close the drawer, and the drawer stays open when the viewport is resized past the `lg` breakpoint.

## What Changes

- Replace all `style={{ background: 'var(--sidebar-bg)' }}` / `style={{ borderBottom: '...var(--sidebar-border)' }}` inline styles in `sidebar.tsx` and `mobile-drawer.tsx` with equivalent Tailwind utility classes (`bg-sidebar-bg`, `text-sidebar-fg`, `border-sidebar-border`, etc.)
- Remove the `.sidebar-nav-item` / `.sidebar-nav-item--active` CSS class rules from `index.css` and replace with Tailwind utilities on the `<Link>` element
- Pass an `onNavigate` callback into `<Sidebar>` so that clicking a nav item closes the drawer (mobile only)
- Use a `useEffect` + `window.matchMedia` listener (or a resize observer on `lg` breakpoint) in `AppShell` to close the drawer automatically when the viewport widens past `lg`

## Capabilities

### New Capabilities

- `mobile-drawer-close-on-navigate`: Drawer closes when a nav link is pressed on mobile
- `mobile-drawer-close-on-resize`: Drawer closes automatically when the viewport grows past the `lg` breakpoint

### Modified Capabilities

- `app-shell`: New scenarios for auto-close on navigation and on resize to desktop

## Impact

- `src/app-shell/sidebar.tsx` — new `onNavigate` prop; nav items call it on click; all inline styles replaced with Tailwind utilities; CSS class names removed
- `src/app-shell/mobile-drawer.tsx` — passes `onNavigate` to `<Sidebar>`; `style` prop on `Drawer.Dialog` replaced with `className`
- `src/app-shell/app-shell.tsx` — adds `useEffect` for media-query listener to auto-close drawer on resize
- `src/index.css` — removes `.sidebar-nav-item` / `.sidebar-nav-item--active` blocks (styles moved inline to JSX)
- `src/app-shell/__tests__/app-shell.spec.tsx` — new tests for navigate-close and resize-close behaviours
