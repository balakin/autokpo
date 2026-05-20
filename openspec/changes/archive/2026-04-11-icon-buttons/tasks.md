## 1. WorkingLayout — Add entry button

- [x] 1.1 Replace `<Button>Dodaj unos</Button>` in `src/working-layout/working-layout.tsx` with `<Button isIconOnly aria-label="Dodaj unos"><Icon icon="gravity-ui:plus" /></Button>` wrapped in `<Tooltip content="Dodaj unos">`
- [x] 1.2 Verify `Tooltip` is imported from `@heroui/react` and `Icon` from `@iconify/react`
- [x] 1.3 Update `src/working-layout/__tests__/working-layout.spec.tsx` to query the Add button by `aria-label` instead of button text

## 2. EntityProfilePreview — Edit button

- [x] 2.1 Replace `<Button variant="secondary">Uredi</Button>` in `src/entity-profiles/entity-profile-preview.tsx` with `<Button isIconOnly variant="secondary" aria-label="Uredi"><Icon icon="gravity-ui:pencil" /></Button>` wrapped in `<Tooltip content="Uredi">`
- [x] 2.2 Update `src/entity-profiles/__tests__/entity-profile-preview.spec.tsx` to query the Edit button by `aria-label` instead of button text

## 3. SignaturePreview — Edit button

- [x] 3.1 Replace `<Button variant="secondary">Uredi</Button>` in `src/signatures/signature-preview.tsx` with `<Button isIconOnly variant="secondary" aria-label="Uredi"><Icon icon="gravity-ui:pencil" /></Button>` wrapped in `<Tooltip content="Uredi">`
- [x] 3.2 Update `src/signatures/__tests__/signature-preview.spec.tsx` to query the Edit button by `aria-label` instead of button text

## 4. EntriesTable — Edit and Delete buttons

- [x] 4.1 Replace `<Button size="sm" variant="secondary">Uredi</Button>` in `src/entries/entries-table.tsx` with `<Button isIconOnly size="sm" variant="secondary" aria-label="Uredi"><Icon icon="gravity-ui:pencil" /></Button>` wrapped in `<Tooltip content="Uredi">`
- [x] 4.2 Replace `<Button size="sm" variant="danger-soft" ...>Obriši</Button>` with `<Button isIconOnly size="sm" variant="danger-soft" aria-label="Obriši" ...><Icon icon="gravity-ui:trash-bin" /></Button>` wrapped in `<Tooltip content="Obriši">`
- [x] 4.3 Update `src/entries/__tests__/entries-table.spec.tsx` to query Edit and Delete buttons by `aria-label` instead of button text

## 5. Tooltip delay

- [x] 5.1 Add `delay={700}` to all five `<Tooltip>` instances across `working-layout.tsx`, `entity-profile-preview.tsx`, `signature-preview.tsx`, and `entries-table.tsx`

## 6. Verification

- [x] 6.1 Run `pnpm test` and confirm all tests pass
- [x] 6.2 Start dev server and visually verify all five icon buttons render correctly with correct icons
- [x] 6.3 Verify tooltips appear after hover delay for all five buttons
