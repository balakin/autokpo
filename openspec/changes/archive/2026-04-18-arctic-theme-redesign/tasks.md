## 1. Design Token System

- [x] 1.1 Define light mode arctic palette tokens on `:root` in `src/index.css` (background, surface, overlay, foreground, muted, accent, semantic colors, field vars, shadows, backdrop)
- [x] 1.2 Define dark mode arctic palette tokens on `.dark, [data-theme='dark']` in `src/index.css`
- [x] 1.3 Define sidebar tokens separately for light (`:root, [data-theme='light']`) and dark (`.dark, [data-theme='dark']`) modes
- [x] 1.4 Expose sidebar tokens and `--accent-soft` to Tailwind via `@theme inline`

## 2. App Shell Components

- [x] 2.1 Update sidebar logo text from "КПО" to "KPO" in `src/app-shell/sidebar.tsx`
- [x] 2.2 Replace hand-rolled version badge `<span>` with `<Chip size="sm" variant="soft" color="success">` in `src/app-shell/sidebar.tsx`
- [x] 2.3 Change top-bar hamburger button variant from `tertiary` to `ghost` in `src/app-shell/top-bar.tsx`
- [x] 2.4 Remove hardcoded `className` with sidebar-fg colors from the mobile drawer close button in `src/app-shell/mobile-drawer.tsx`

## 3. Entry Modal Cleanup

- [x] 3.1 Remove `<Surface variant="default">` wrapper from inside `Modal.Body` in `src/entries/entry-modal.tsx`

## 4. HTML Shell

- [x] 4.1 Update page `<title>` from `kpo` to `KPO` in `index.html`
- [x] 4.2 Add `class="text-foreground"` to `<body>` in `index.html`

## 5. Verification

- [x] 5.1 Run `pnpm build` and confirm no TypeScript errors
- [x] 5.2 Run `pnpm test` and confirm all tests pass (update any snapshot or text assertions referencing old "КПО" logo text)
- [x] 5.3 Visually verify sidebar appearance in both light and dark modes
