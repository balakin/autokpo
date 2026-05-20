## 1. Data Model & Context

- [x] 1.1 Create `src/signatures/signature-schema.ts` with `signatureSchema` (Zod) and `Signature` type
- [x] 1.2 Create `src/signatures/signature-context.tsx` with `SignatureContext`, `useState`, localStorage sync on save, and `safeParse` on load
- [x] 1.3 Mount `SignatureProvider` at app root in `src/app.tsx` alongside `EntityProfileProvider` and `EntriesProvider`

## 2. Signature Form Component

- [x] 2.1 Create `src/signatures/signature-form.tsx` — React Hook Form + Zod resolver with fields: `sastavioIme` (text, label "Sastavio") and `odgovornoLiceIme` (text, label "Odgovorno lice")
- [x] 2.2 Display `fieldState.error.message` under each field
- [x] 2.3 On valid submit: call context save, show success feedback ("Potpis je sačuvan")
- [x] 2.4 On mount: pre-populate via `reset(signature)` when context signature is non-null

## 3. Integration

- [x] 3.1 Render `SignatureForm` at the bottom of the main application view (`src/app.tsx`), below the entries table

## 4. Tests

- [x] 4.1 Component test: `SignatureForm` renders both fields with correct Serbian labels
- [x] 4.2 Component test: submitting with empty fields shows "Polje je obavezno" for each
- [x] 4.3 Component test: submitting valid values calls context save action
- [x] 4.4 Component test: form pre-populates when context signature is non-null

## 5. Storage Refactor

- [x] 5.1 Create `src/signatures/signature-storage.ts` with `getSignature` and `saveSignatureToStorage` (mirrors `entity-profile-storage.ts`)
- [x] 5.2 Create `src/signatures/signature-storage.spec.ts` — unit tests for both storage functions (null on empty, null on invalid JSON, null on schema failure, returns data on valid, overwrites)
- [x] 5.3 Refactor `src/signatures/signature-context.tsx` to use `getSignature` / `saveSignatureToStorage` from the storage module
