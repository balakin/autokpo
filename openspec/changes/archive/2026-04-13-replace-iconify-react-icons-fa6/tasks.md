## 1. Dependencies

- [x] 1.1 Run `pnpm add react-icons` to install the new icon library
- [x] 1.2 Run `pnpm remove @iconify/react` to uninstall the old icon library

## 2. Update source files

- [x] 2.1 `src/entity-profiles/entity-profile-preview.tsx` — replace `import { Icon } from '@iconify/react'` with `import { FaPencil } from 'react-icons/fa6'`; replace `<Icon icon="gravity-ui:pencil" />` with `<FaPencil />`
- [x] 2.2 `src/entries/entries-table.tsx` — replace `import { Icon } from '@iconify/react'` with FA6 imports; replace `<Icon icon="gravity-ui:tray" className="size-6 text-muted" />` with `<FaInbox className="size-6 text-muted" />`; replace `<Icon icon="gravity-ui:pencil" />` with `<FaPencil />`; replace `<Icon icon="gravity-ui:trash-bin" />` with `<FaTrashCan />`
- [x] 2.3 `src/setup-wizard/welcome-step.tsx` — replace `import { Icon } from '@iconify/react'` with FA6 imports; replace `icon="gravity-ui:book"` prop (on HeroUI component) — check if this is an `<Icon>` or a prop; replace `<Icon icon="gravity-ui:arrow-right" aria-hidden="true" />` with `<FaArrowRight aria-hidden="true" />`
- [x] 2.4 `src/signatures/signature-preview.tsx` — replace `import { Icon } from '@iconify/react'` with `import { FaPencil } from 'react-icons/fa6'`; replace `<Icon icon="gravity-ui:pencil" />` with `<FaPencil />`
- [x] 2.5 `src/ui/stepper/stepper-label.tsx` — replace `import { Icon } from '@iconify/react'` with `import { FaCheck } from 'react-icons/fa6'`; replace `<Icon icon="gravity-ui:check" width={16} height={16} />` with `<FaCheck size={16} />`
- [x] 2.6 `src/working-layout/working-layout.tsx` — replace `import { Icon } from '@iconify/react'` with `import { FaPlus } from 'react-icons/fa6'`; replace `<Icon icon="gravity-ui:plus" />` with `<FaPlus />`

## 3. Update conventions

- [x] 3.1 Update `CLAUDE.md` icon convention section: replace `@iconify/react` / `gravity-ui:` instructions with `react-icons/fa6` named-import pattern and remove the Iconify API verification command

## 4. Verification

- [x] 4.1 Run `pnpm build` — confirm zero errors
- [x] 4.2 Run `pnpm test` — confirm all tests pass
- [x] 4.3 Run `pnpm dev` and visually verify icons render in: entity-profile-preview card, entries table (empty state tray, edit pencil, delete trash), welcome step (book icon, arrow), signature-preview card, stepper (check), working-layout (plus)
