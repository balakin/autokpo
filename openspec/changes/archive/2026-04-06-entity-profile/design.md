## Context

The KPO book (Knjiga o ostvarenom prometu paušalno oporezovanih obveznika) is a legally required register for Serbian flat-rate taxpayers. Every page of the official template includes a fixed header section identifying the legal entity. This design covers how `EntityProfileForm` captures those fields, how they are persisted, and how they feed into the rest of the application.

There is no backend. The application is a fully client-side SPA (React + Vite). All persistence uses `localStorage`.

## Goals / Non-Goals

**Goals:**

- Render a form with all six KPO header fields
- Validate PIB (9-digit tax ID) format client-side
- Persist filled profile to `localStorage` under key `kpo:entity-profile`
- Restore profile from `localStorage` on app load
- Export profile shape as a TypeScript type consumed by the PDF export module

**Non-Goals:**

- Server-side storage or sync
- PIB verification against any external registry
- Multi-profile support (one profile per browser)
- Internationalisation beyond Serbian UI labels

## Decisions

### D1 — Form library and validation

**Decision**: Use React Hook Form with a **Zod schema resolver** (`@hookform/resolvers/zod`). The Zod schema is the single source of truth for both the `EntityProfile` TypeScript type (via `z.infer`) and all validation rules.

**Rationale**: Zod co-locates type and validation logic, eliminating duplication between the `interface` and RHF inline rule objects. The schema is reusable outside the form (e.g. for parsing `localStorage` values safely). React Hook Form avoids unnecessary re-renders. Alternative (plain `useState` + manual validation) would require duplicate type definitions and manual dirty tracking.

**Alternatives considered**: Formik + yup — heavier bundle, no type-inference benefit at this scale.

---

### D2 — Storage key schema

**Decision**: Persist the profile as a single JSON blob under `kpo:entity-profile`. The `EntityProfile` type is derived from the Zod schema via `z.infer`:

```ts
const entityProfileSchema = z.object({
  pib: z.string().regex(/^\d{9}$/, 'PIB mora imati tačno 9 cifara'),
  obveznik: z.string().min(1, 'Polje je obavezno'),
  firmaRadnje: z.string().min(1, 'Polje je obavezno'),
  sediste: z.string().min(1, 'Polje je obavezno'),
  sifraPoreskogObveznika: z
    .string()
    .regex(/^\d{8}$/, 'Šifra poreskog obveznika mora imati tačno 8 cifara'),
  sifraDelatnosti: z
    .string()
    .regex(/^\d{4}$/, 'Šifra delatnosti mora imati tačno 4 cifre'),
});

type EntityProfile = z.infer<typeof entityProfileSchema>;
```

The schema is also used when reading from `localStorage` (`entityProfileSchema.safeParse(JSON.parse(...))`) to guard against stale or corrupted storage values.

**Rationale**: All six fields are always needed together. No need for partial reads. A single key keeps the storage footprint predictable and easy to clear/reset.

---

### D3 — When to persist

**Decision**: Persist on **form submit** (explicit save button), not on every keystroke.

**Rationale**: Auto-save on change can cause confusing intermediate states and makes it harder to cancel edits. A clear "Sačuvaj" (Save) button matches user mental model.

---

### D4 — Profile availability to the rest of the app

**Decision**: Export profile via a React context (`EntityProfileContext`) populated at app root on mount.

**Rationale**: The PDF export module and the page header preview both need the profile. Context avoids prop-drilling and keeps reads synchronous (data is already in memory after the initial `localStorage.getItem`).

## Risks / Trade-offs

- [Risk] User clears browser storage → profile lost → Mitigation: Show a warning banner when profile is empty; form is the first thing shown on load.
- [Risk] PIB validation is only format-based, not checksum-verified → Mitigation: Out of scope for V1; the legal obligation is on the taxpayer to enter correct data.
- [Trade-off] Single-profile design means the app can only represent one legal entity per browser. Acceptable for V1 (паушал taxpayers are individuals).
