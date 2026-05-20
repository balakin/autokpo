## 1. Types and Storage

- [x] 1.1 Install `zod` and `@hookform/resolvers` (`pnpm add zod @hookform/resolvers`)
- [x] 1.2 Define `entityProfileSchema` (Zod) and derive `EntityProfile` type via `z.infer` in `src/entity-profiles/entity-profile-schema.ts`; PIB: `/^\d{9}$/`, Šifra poreskog obveznika (Matični broj): `/^\d{8}$/`, Šifra delatnosti: `/^\d{4}$/`, remaining fields: `.min(1)`
- [x] 1.3 Implement `getEntityProfile(): EntityProfile | null` helper reading from `localStorage` key `kpo:entity-profile`; parse with `entityProfileSchema.safeParse` and return `null` on failure
- [x] 1.4 Implement `saveEntityProfile(profile: EntityProfile): void` helper writing to `localStorage`

## 2. Context

- [x] 2.1 Create `EntityProfileContext` with `profile: EntityProfile | null` and `saveProfile` action in `src/entity-profiles/entity-profile-context.tsx`
- [x] 2.2 Create `EntityProfileProvider` that initialises state from `localStorage` on mount and wraps the app root
- [x] 2.3 Register `EntityProfileProvider` in `src/main.tsx`

## 3. Form Component

- [x] 3.1 Install `react-hook-form` if not already present (`pnpm add react-hook-form`)
- [x] 3.2 Create `EntityProfileForm` component in `src/entity-profiles/entity-profile-form.tsx` using `useForm` with `zodResolver(entityProfileSchema)`
- [x] 3.3 Render all six labelled fields in Serbian; display `fieldState.error.message` from RHF under each field
- [x] 3.4 On valid submit: call `saveProfile` from context, show success toast in Serbian ("Profil je sačuvan")
- [x] 3.5 On mount: pre-populate fields via `reset(profile)` when context profile is non-null

## 4. Integration

- [x] 4.1 Render `EntityProfileForm` as the first visible section of the app (above the entry table)
- [x] 4.2 Show an alert banner in Serbian when no profile is saved yet: "Popunite podatke o obvezniku pre unosa prometa"

## 5. Tests

- [x] 5.1 Unit test `getEntityProfile` / `saveEntityProfile` helpers using `vitest` with a mocked `localStorage`
- [x] 5.2 Component test: `EntityProfileForm` renders all six fields with correct Serbian labels
- [x] 5.3 Component test: submitting with empty fields shows "Polje je obavezno" for each field
- [x] 5.4 Component test: submitting with invalid PIB shows correct error message
- [x] 5.5 Component test: submitting with invalid Šifra poreskog obveznika (not 8 digits) shows "Šifra poreskog obveznika mora imati tačno 8 cifara"
- [x] 5.6 Component test: submitting with invalid Šifra delatnosti (not 4 digits) shows "Šifra delatnosti mora imati tačno 4 cifre"
- [x] 5.7 Component test: submitting a valid profile calls `saveProfile` from context
- [x] 5.8 Component test: form pre-populates when context profile is non-null
