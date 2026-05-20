## Context

The official KPO template has a signature block at the bottom of every page with two labelled fields: "Sastavio" (the person who compiled the book) and "Odgovorno lice" (the responsible/authorised person). These are required for a legally valid printed/exported KPO book.

The application already captures entity profile data via `entity-profiles/`. The signature block is a separate, short-lived concern — it may differ per print run and is not part of the core entity identity.

## Goals / Non-Goals

**Goals:**

- Define a `Signature` data model with `sastavioIme` and `odgovornoLiceIme`
- Validate both fields as non-empty strings
- Persist to `localStorage` under `kpo:signature`
- Expose via `SignatureContext` for the PDF export module
- Render a compact form/display at the bottom of the app view

**Non-Goals:**

- Digital signatures or cryptographic signing
- Multiple signatories
- Signature image/scan upload

## Decisions

### D1 — Data model

**Decision**: Simple two-field Zod schema, no UUID needed:

```ts
const signatureSchema = z.object({
  sastavioIme: z.string().min(1, 'Polje je obavezno'),
  odgovornoLiceIme: z.string().min(1, 'Polje je obavezno'),
});

type Signature = z.infer<typeof signatureSchema>;
```

**Rationale**: The signature block is a fixed two-field structure matching the template exactly. Zod + `z.infer` keeps types and validation co-located, consistent with `entity-profile` and `entry-management`.

---

### D2 — Persistence

**Decision**: Persist as a single JSON object under `kpo:signature`. Read with `signatureSchema.safeParse(...)` on load.

**Rationale**: Same pattern as `kpo:entity-profile`. A single object is sufficient — there is only ever one active signature block.

---

### D3 — Context pattern

**Decision**: `SignatureContext` (React Context + `useState`) at app root, initialised from `localStorage` on mount, synced on save.

**Rationale**: Mirrors `EntityProfileContext`. `useState` is sufficient here — no complex actions like add/update/delete needed.

---

### D4 — Co-location

**Decision**: All files in `src/signatures/` — schema, context, form component.

**Rationale**: Consistent with `src/entity-profiles/` and `src/entries/` feature-folder convention.

## Risks / Trade-offs

- [Trade-off] `sastavioIme` and `odgovornoLiceIme` may often be the same person — no deduplication needed for V1, users simply fill both.
- [Risk] User clears storage → signature lost → Mitigation: same as entity-profile; form is always visible and quick to re-fill.
