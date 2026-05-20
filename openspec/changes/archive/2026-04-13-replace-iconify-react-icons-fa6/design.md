## Context

The app currently uses `@iconify/react` with the `gravity-ui:` icon prefix. Iconify resolves SVG icons from its CDN at runtime — a fetch per icon family on first load. The app has 6 source files using 7 distinct gravity-ui icons. All usage is the `<Icon icon="gravity-ui:*" />` pattern.

`react-icons` is the standard alternative: icons ship as tree-shakeable ES modules, bundled at build time by Vite. No CDN, no network, smaller runtime footprint.

## Goals / Non-Goals

**Goals:**

- Eliminate the runtime CDN dependency introduced by `@iconify/react`.
- Replace all 6 `@iconify/react` usages with `react-icons/fa6` equivalents.
- Remove `@iconify/react` from `package.json` entirely.
- Update CLAUDE.md icon convention to reflect the new standard.

**Non-Goals:**

- Pixel-perfect icon parity — FA6 icons differ aesthetically from Gravity UI icons; semantic equivalence is sufficient.
- Replacing icons in archived openspec documents.
- Changing icon sizes, colors, or button behavior.

## Decisions

### react-icons/fa6 over other icon libraries

`react-icons` is the most widely-used React icon library. FA6 (Font Awesome 6) has a comprehensive free set covering all 7 icons needed. Tree-shaking via named ESM imports keeps bundle size proportional to usage.

Alternatives considered:

- **Keep `@iconify/react` with local icon data** — adds bundle complexity, not needed.
- **`@phosphor-icons/react`** — good library but less familiar, no clear advantage here.
- **Custom SVGs** — maintenance burden, CLAUDE.md previously banned ad-hoc SVGs for good reason.

### Icon mapping

| gravity-ui icon          | FA6 component  | Rationale                              |
| ------------------------ | -------------- | -------------------------------------- |
| `gravity-ui:pencil`      | `FaPencil`     | Direct semantic match                  |
| `gravity-ui:trash-bin`   | `FaTrashCan`   | Direct semantic match (filled trash)   |
| `gravity-ui:tray`        | `FaInbox`      | Empty-state illustration; inbox = tray |
| `gravity-ui:book`        | `FaBook`       | Direct semantic match                  |
| `gravity-ui:arrow-right` | `FaArrowRight` | Direct semantic match                  |
| `gravity-ui:check`       | `FaCheck`      | Direct semantic match                  |
| `gravity-ui:plus`        | `FaPlus`       | Direct semantic match                  |

### Usage pattern

Replace `<Icon icon="gravity-ui:pencil" />` with a named import:

```tsx
// Before
import { Icon } from '@iconify/react';
<Icon icon="gravity-ui:pencil" />;

// After
import { FaPencil } from 'react-icons/fa6';
<FaPencil />;
```

Sizing: `react-icons` components inherit font-size by default. Where the existing code uses `className="size-6"` on the `<Icon>` element, apply the same className to the FA6 component. Width/height props (e.g., `width={16} height={16}` on stepper-label) translate to `style={{ width: 16, height: 16 }}` or equivalent Tailwind classes.

## Risks / Trade-offs

- **Visual regression** — FA6 icons differ in stroke weight and style from Gravity UI. The app has no visual regression tests. Manual review after implementation is required.
  → Mitigation: The icon shapes (pencil, trash, check, plus, etc.) are standard and universally recognizable; functional correctness is preserved.

- **Size attribute translation** — `@iconify/react` accepts `width`/`height` props; `react-icons` uses `size` (number, sets both). The one usage with explicit sizing (`stepper-label.tsx`, `width={16} height={16}`) must be translated correctly.
  → Mitigation: Handled explicitly in tasks.

## Migration Plan

1. `pnpm add react-icons`
2. `pnpm remove @iconify/react`
3. Update each of the 6 source files (import swap + JSX swap).
4. Update CLAUDE.md icon convention section.
5. Run `pnpm build` and `pnpm test` — no behavioral changes expected.
6. Manual browser check for visual correctness.

Rollback: revert commits — no data migration, no API changes.

## Open Questions

None. All icon mappings are unambiguous and the library choice is settled.
