## Why

Digit-only fields like PIB (9 digits), šifra poreskog obveznika (8 digits), and šifra delatnosti (4 digits) accept any text input. Users can type letters and symbols, with validation only firing on submit. On mobile devices, the full alphabetic keyboard is shown instead of a numeric one. This creates a poor UX: wrong input is invisible until submit, and mobile users must switch keyboards.

## What Changes

- Add `inputMode="numeric"` attribute to digit-only `<Input>` elements to trigger the numeric keyboard on mobile devices
- Add `maxLength` HTML attributes matching each field's expected digit length (9, 8, 4) for hard client-side character limits
- Extract a `digitsOnly` helper (`src/formatters.ts`) that strips non-digit characters on input change, used in the `onChange` handler of the three digit fields

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `entity-profile`: PIB, šifra poreskog obveznika, and šifra delatnosti form fields now restrict input to digits only, enforce maxLength, and show numeric keyboard on mobile

## Impact

- `src/formatters.ts` — add `digitsOnly` helper function
- `src/entity-profiles/entity-profile-form.tsx` — import `digitsOnly` from `formatters`, add `inputMode="numeric"` and `maxLength` to three `<Input>` elements, wrap `onChange` with `digitsOnly`
- Existing tests should pass unchanged
