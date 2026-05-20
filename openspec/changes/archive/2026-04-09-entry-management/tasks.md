## 1. Data Model & Context

- [x] 1.0 Install `@internationalized/date`: `pnpm add @internationalized/date`
- [x] 1.1 Create `src/entries/entries-schema.ts` with `kpoEntrySchema` (Zod) and `KpoEntry` type
- [x] 1.2 Split context into separate files: `entries-context.ts` (context + types), `entries-provider.tsx` (`EntriesProvider` component), `entries-reducer.ts` (add/update/delete reducer + syncing wrapper), `entries-storage.ts` (`getEntries`/`saveEntries` with `safeParse`)
- [x] 1.3 Mount `EntriesProvider` at app root in `src/app.tsx` alongside `EntityProfileProvider`

## 2. Entries Table Component

- [x] 2.1 Create `src/entries/entries-table.tsx` — table with columns: Redni broj (1), Datum i opis knjiženja (2), Od prodaje proizvoda (3), Od izvršenih usluga (4), Svega (3+4, computed inline), Actions (edit/delete)
- [x] 2.2 Implement empty-state message in Serbian when entries array is empty
- [x] 2.3 Entries render in insertion order (no sorting)
- [x] 2.4 Add "Dodaj unos" button above the table that opens the add-entry modal

## 3. Entry Form & Modal

- [x] 3.1 Create `src/entries/entry-form.tsx` — React Hook Form + Zod resolver with fields: datumPrometa (date picker), opisPrometa (text), odProdajeProizvoda (currency string, default `''`), odIzvrsenihUsluga (currency string, default `''`); separate internal `entryFormSchema` converts strings to integers on submit
- [x] 3.2 Create `src/entries/entry-modal.tsx` — HeroUI modal wrapping `EntryForm`; accepts optional `id` prop (present = edit mode, resolves entry from context; absent = add mode); pre-fills form in edit mode
- [x] 3.3 Implement "Sačuvaj" submit button and "Otkaži" cancel button in the modal
- [x] 3.4 On successful save dispatch `ADD_ENTRY` (new entry, id assigned via `crypto.randomUUID()`) or `UPDATE_ENTRY` (edit) action; close modal

## 4. Delete Confirmation

- [x] 4.1 Add delete button per row that dispatches `DELETE_ENTRY` after user confirmation via native `window.confirm()`

## 5. Integration

- [x] 5.1 Render `EntriesTable` in the main application view (`src/app.tsx`) below the entity profile form
- [x] 5.2 Verify `EntriesContext` value is accessible via `useContext` in a consumer (manual smoke test)

## 6. Tests

- [x] 6.1 Write Vitest + React Testing Library test: entries table renders empty state when no entries
- [x] 6.2 Write test: adding an entry via the form shows it in the table
- [x] 6.3 Write test: editing an entry updates the displayed row
- [x] 6.4 Write test: deleting an entry removes it from the table
- [x] 6.5 Write test: validation errors shown for empty required fields on submit
- [x] 6.6 Write test: `EntriesContext` provides updated array after add/edit/delete
