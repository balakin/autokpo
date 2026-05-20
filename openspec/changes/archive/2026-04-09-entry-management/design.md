## Context

The KPO book requires a ledger of individual transaction entries. Each entry corresponds to one row on the official KPO form template. This design covers the data model for a single entry, how entries are stored and managed, how CRUD operations are exposed to the UI, and how they feed into the PDF export module.

There is no backend. The application is a fully client-side SPA (React + Vite). All persistence uses `localStorage`.

## Goals / Non-Goals

**Goals:**

- Define the `KpoEntry` data model matching the official KPO row fields
- Validate entry fields client-side using Zod
- Display all entries in a table in insertion order
- Allow adding new entries via a form
- Allow editing and deleting existing entries
- Persist entries to `localStorage` under key `kpo:entries` (JSON array)
- Expose entries via `EntriesContext` for consumption by the PDF export module

**Non-Goals:**

- Pagination (entry count per KPO period is typically small)
- Import/export of entries as CSV
- Bulk delete
- Server-side storage or sync

## Decisions

### D1 — Entry data model

**Decision**: Each entry is a plain object with a UUID `id` as the stable primary key, generated with `crypto.randomUUID()` on creation. `redniBroj` (row number) is NOT stored — it is derived as the array index + 1 when rendering the table and PDF.

```ts
const kpoEntrySchema = z.object({
  id: z.uuid(),
  datumPrometa: z
    .string()
    .min(1, 'Polje je obavezno')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan format datuma'),
  opisPrometa: z.string().min(1, 'Polje je obavezno'),
  odProdajeProizvoda: z
    .number()
    .int()
    .min(0, 'Vrednost ne može biti negativna'),
  odIzvrsenihUsluga: z.number().int().min(0, 'Vrednost ne može biti negativna'),
});

type KpoEntry = z.infer<typeof kpoEntrySchema>;
// svega = odProdajeProizvoda + odIzvrsenihUsluga — computed, not stored
```

**Rationale**: Fields match the official KPO template columns exactly — column (3) "od prodaje proizvoda" and column (4) "od izvršenih usluga". Column "Svega (RSD)" is derived as (3+4) and computed in the UI/PDF, not persisted. A UUID id is a more robust key than `redniBroj` because it remains stable across deletions and does not require a sequential counter. `redniBroj` is a display concern only — auto-assigned as array index + 1 at render time. Zod provides type inference and `safeParse` for localStorage reads.

**Alternatives considered**: `redniBroj` as PK — fragile under deletion (gaps), requires a counter, and the legal sequential numbering is already handled at render/PDF time. Array index as key — fragile under deletion. Storing `svega` — redundant derived value, risks inconsistency.

---

### D2 — Storage schema

**Decision**: Persist entries as a JSON array under `kpo:entries`. Read with `z.array(kpoEntrySchema).safeParse(...)` to guard against stale or corrupted data.

**Rationale**: A flat array is the simplest structure for an ordered ledger. No relational concerns. Consistent with `kpo:entity-profile` approach.

---

### D3 — CRUD interaction pattern

**Decision**: Use a **modal dialog** for both add and edit forms.

**Rationale**: The entry form has 4 fields (datumPrometa, opisPrometa, odProdajeProizvoda, odIzvrsenihUsluga). An inline row-edit approach would collapse the table layout. A modal keeps the table as the primary surface and provides a focused editing context. HeroUI modal component provides accessible semantics out of the box.

**Alternatives considered**: Inline row editing — clutters the table, difficult on narrow screens. Navigation to a separate route — overkill for an SPA with no router yet.

---

### D4 — State management

**Decision**: Manage entries in `EntriesContext` (React Context + `useReducer`). Context is populated from `localStorage` on mount and synced back on every state change.

**Rationale**: Mirrors the `EntityProfileContext` pattern established in `entity-profile`. `useReducer` handles add/update/delete actions cleanly. Context makes entries available to the future `pdf-export` module without prop-drilling.

---

### D5 — Form library

**Decision**: React Hook Form with `@hookform/resolvers/zod`, same as `entity-profile`. The form uses a **separate internal schema** (`entryFormSchema`) where the two amount fields are typed as `string` rather than `number`. On successful submit the strings are parsed and rounded to integers before being placed into a `KpoEntry`.

**Rationale**: Consistency across the codebase. The separate form schema is necessary because the currency input component (`react-currency-input-field`) binds to a string value. `kpoEntrySchema` remains the canonical type for stored data; `entryFormSchema` is a UI concern only.

---

### D6 — Date representation

**Decision**: Use `DateValue` from `@internationalized/date` as the DatePicker value type. Store dates as ISO `YYYY-MM-DD` strings in `localStorage`. Convert with `value.toString()` on save and `parseDate(string)` on restore.

**Rationale**: HeroUI v3 DatePicker is built on React Aria and expects `DateValue` / `CalendarDate` objects. `.toString()` on a `CalendarDate` produces `YYYY-MM-DD` natively, so no custom serialisation is needed. The Zod field `z.string().regex(/^\d{4}-\d{2}-\d{2}$/, ...)` validates the stored format.

**New dependency**: `@internationalized/date` must be installed.

## Risks / Trade-offs

- [Risk] Large entry arrays could slow `localStorage` serialization → Mitigation: KPO books are annual; entry count is bounded (~365 max). Not a practical concern for V1.
- [Trade-off] Modal-based editing adds one extra click compared to inline editing but significantly simplifies the table layout and is more accessible.
