## Why

The app currently shows all forms inline at all times, which is noisy and wastes space once the user has already set up their entity profile and signature. Once both are saved to localStorage, the user is in a "working" state and needs a focused layout centered on data entry and PDF export — not form setup.

## What Changes

- When both entity profile and signature exist in localStorage, the app renders a new working layout instead of the current setup layout
- The working layout uses a responsive two-column layout: entries table as the primary content (left on large screens), sidebar with download PDF button, entity profile preview card, and signature preview card (right on large screens; appears first on mobile)
- Entity profile and signature are rendered in read-only preview mode (all fields visible) with an "Uredi" button that opens an edit modal
- The edit modal wraps the existing form components; closing after save is handled via an `onSuccess` callback prop added to each form
- The setup layout (current app.tsx content) is preserved unchanged for first-time users

## Capabilities

### New Capabilities

- `working-layout`: Two-mode app layout — setup layout (when profile or signature is missing) and working layout (when both exist). Working layout shows download button, entity profile preview, entries table, and signature preview in row order.
- `entity-profile-preview`: Read-only display of all entity profile fields inside a Card with a Surface secondary data grid, plus an edit modal containing the existing EntityProfileForm.
- `signature-preview`: Read-only display of all signature fields inside a Card with a Surface secondary data grid, plus an edit modal containing the existing SignatureForm.

### Modified Capabilities

- `entity-profile`: Forms gain an `onSuccess?: () => void` prop, called after successful save, enabling modal close-on-save behavior.
- `signature`: Forms gain an `onSuccess?: () => void` prop, called after successful save, enabling modal close-on-save behavior.

## Impact

- `src/app.tsx`: Refactored to detect mode and render either setup or working layout
- `src/entity-profiles/entity-profile-form.tsx`: Adds `formId` (required) and `onSuccess` (optional) props; removes internal submit button
- `src/signatures/signature-form.tsx`: Adds `formId` (required) and `onSuccess` (optional) props; removes internal submit button
- New: `src/entity-profiles/entity-profile-preview.tsx`
- New: `src/entity-profiles/__tests__/entity-profile-preview.spec.tsx`
- New: `src/signatures/signature-preview.tsx`
- New: `src/signatures/__tests__/signature-preview.spec.tsx`
- New: `src/working-layout/working-layout.tsx`
- New: `src/working-layout/__tests__/working-layout.spec.tsx`
- New: `src/setup-layout/setup-layout.tsx`
- New: `src/setup-layout/__tests__/setup-layout.spec.tsx`
- No new dependencies, no API changes, no breaking changes to existing behavior
