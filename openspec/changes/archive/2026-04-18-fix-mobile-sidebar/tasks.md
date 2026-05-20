## 1. Replace inline styles with Tailwind utilities

- [x] 1.1 In `sidebar.tsx`, replace `style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}` on the root `<div>` with `className` additions: `bg-sidebar-bg text-sidebar-fg`
- [x] 1.2 In `sidebar.tsx`, replace `style={{ borderBottom: '1px solid var(--sidebar-border)' }}` on the logo `<div>` with `border-b border-sidebar-border`
- [x] 1.3 In `sidebar.tsx`, replace `style={{ borderTop: '1px solid var(--sidebar-border)' }}` on the footer `<div>` with `border-t border-sidebar-border`
- [x] 1.4 In `sidebar.tsx`, replace the `className` string on `<Link>` (which references `.sidebar-nav-item` / `.sidebar-nav-item--active`) with equivalent Tailwind utilities: base color `text-sidebar-muted`, hover `hover:bg-sidebar-item-hover hover:text-sidebar-fg`, focus `focus-visible:bg-sidebar-item-hover focus-visible:text-sidebar-fg`, active `bg-sidebar-active-bg text-sidebar-active-fg hover:bg-sidebar-active-bg hover:text-sidebar-active-fg`
- [x] 1.5 In `mobile-drawer.tsx`, replace `style={{ background: 'var(--sidebar-bg)' }}` on `Drawer.Dialog` with `className="... bg-sidebar-bg"`
- [x] 1.6 In `src/index.css`, remove the `.sidebar-nav-item`, `.sidebar-nav-item:hover`, `.sidebar-nav-item:focus-visible`, `.sidebar-nav-item--active`, `.sidebar-nav-item--active:hover`, `.sidebar-nav-item--active:focus-visible` rule blocks

## 2. Close drawer on nav link click

- [x] 2.1 Add optional `onNavigate?: () => void` prop to the `SidebarProps` interface in `sidebar.tsx`
- [x] 2.2 Add `onClick={() => onNavigate?.()}` to each `<Link>` element inside the `NAV_ITEMS.map` in `sidebar.tsx`
- [x] 2.3 In `mobile-drawer.tsx`, pass `onNavigate={() => onOpenChange(false)}` to `<Sidebar>`

## 3. Auto-close drawer on resize to desktop

- [x] 3.1 In `app-shell.tsx`, add a `useEffect` that reads `--breakpoint-lg` from `getComputedStyle(document.documentElement)`, constructs a `window.matchMedia(`(min-width: ${lg})`)` query, and calls `setIsMobileDrawerOpen(false)` when `e.matches` is true
- [x] 3.2 Ensure the effect returns a cleanup function that calls `mql.removeEventListener('change', handler)`

## 4. Tests

- [x] 4.1 In `app-shell.spec.tsx`, add a test: open the drawer, click a nav link, assert the drawer is closed
- [x] 4.2 In `app-shell.spec.tsx`, add a test: open the drawer, fire a `MediaQueryList` change event with `matches: true`, assert the drawer is closed
- [x] 4.3 Run the full test suite and fix any failures
