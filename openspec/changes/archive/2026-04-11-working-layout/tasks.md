## 1. Refactor Forms (formId pattern)

- [x] 1.1 Refactor `EntityProfileForm`: add required `formId: string` prop, set as `id` on `<Form>`, remove internal submit button, add optional `onSuccess?: () => void` called after save
- [x] 1.2 Refactor `SignatureForm`: add required `formId: string` prop, set as `id` on `<Form>`, remove internal submit button, add optional `onSuccess?: () => void` called after save
- [x] 1.3 Update `EntityProfileForm` tests: submit button no longer rendered inside form; `onSuccess` called on valid submit
- [x] 1.4 Update `SignatureForm` tests: submit button no longer rendered inside form; `onSuccess` called on valid submit

## 2. Entity Profile Preview

- [x] 2.1 Create `src/entity-profiles/entity-profile-preview.tsx` with a Card containing a `Surface variant="secondary"` data grid (`<dl>`) showing all six fields
- [x] 2.2 Add "Uredi" button to the card header using HeroUI `Modal` wrapping `EntityProfileForm` with `onSuccess` closing the modal
- [x] 2.3 Write tests for `EntityProfilePreview`: all field values rendered, edit button opens modal, modal closes on successful save

## 3. Signature Preview

- [x] 3.1 Create `src/signatures/signature-preview.tsx` with a Card containing a `Surface variant="secondary"` data grid (`<dl>`) showing both signature fields
- [x] 3.2 Add "Uredi" button to the card header using HeroUI `Modal` wrapping `SignatureForm` with `onSuccess` closing the modal
- [x] 3.3 Write tests for `SignaturePreview`: both field values rendered, edit button opens modal, modal closes on successful save

## 4. App Layout Switch

- [x] 4.1 Refactor `src/app.tsx` to branch on `profile !== null && signature !== null`; render setup layout when false
- [x] 4.2 Setup layout: add `useId()` for each form, render external `<Button type="submit" form={formId}>` in each card footer
- [x] 4.3 Implement working layout branch: bare download button div, `EntityProfilePreview`, entries table Card with `EntryModal`, `SignaturePreview` — in that order
- [x] 4.4 Update `app.spec.tsx` to cover: setup layout shown when profile missing, setup layout shown when signature missing, working layout shown when both exist

## 5. Setup Layout Module

- [x] 5.1 Create `src/setup-layout/setup-layout.tsx`: extract `SetupLayout` from `app.tsx`, remove the warning alert
- [x] 5.2 Update `src/app.tsx` to import `SetupLayout` from `./setup-layout/setup-layout`
- [x] 5.3 Write `src/setup-layout/__tests__/setup-layout.spec.tsx`: entity profile form card renders, signature form card renders, entity profile card appears before signature card, no warning alert rendered, both "Sačuvaj" buttons present
- [x] 5.4 Write `src/working-layout/__tests__/working-layout.spec.tsx`: "KPO unosi" heading renders, "Dodaj unos" button renders, download PDF button renders, empty entries state shown, entries table shows saved entries, entity profile data renders, signature data renders
