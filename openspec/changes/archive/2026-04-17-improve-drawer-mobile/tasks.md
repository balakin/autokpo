## 1. Consult HeroUI v3 Drawer docs

- [x] 1.1 Run `mcp__heroui-react__list_components` to confirm `Drawer` exists in v3
- [x] 1.2 Run `mcp__heroui-react__get_component_docs` for `Drawer` to check full-screen sizing API

## 2. Update MobileDrawer component

- [x] 2.1 Make `Drawer.Content` fill the full viewport (remove fixed `w-60 max-w-[80vw]`, apply full-screen classes per HeroUI v3 API)
- [x] 2.2 Add a close button (LuX icon, `react-icons/lu`) inside the drawer that calls `onOpenChange(false)`
- [x] 2.3 Run `pnpm -s build` to confirm no TypeScript errors

## 3. Update tests

- [x] 3.1 Check existing tests in `src/app-shell/__tests__/` that cover `MobileDrawer` or the mobile drawer behaviour
- [x] 3.2 Add / update test: close button is rendered when drawer is open
- [x] 3.3 Add / update test: clicking close button calls `onOpenChange(false)`
- [x] 3.4 Run `pnpm -s test --reporter=json --changed` and confirm all pass
