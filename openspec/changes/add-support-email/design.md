## Context

The app's help page and website footer are the two primary surfaces users look at for help and contact information. Currently, GitHub Issues is the only contact channel. A support email broadens access for users who are not on GitHub or who need direct communication.

The email address `support@autokpo.com` is static — no backend changes needed. Both surfaces are purely UI / content changes.

## Goals / Non-Goals

**Goals:**

- Add `mailto:support@autokpo.com` link to the app help page "Kako prijaviti problem" card.
- Add `mailto:support@autokpo.com` link to the website footer legal-links row on all three locales.
- Ensure app strings go through the Lingui i18n pipeline (sr-Latn source + en/ru translations).
- Ensure website label text is defined in `LandingContent` and populated for all three locales.

**Non-Goals:**

- No backend, worker, or database changes.
- No new routing, new page, or new card — both placements are additions to existing UI.
- No email routing, ticketing system, or auto-reply setup.

## Decisions

### App: add inside existing card, not a new card

The "Kako prijaviti problem" card is already about reaching the team. A second list item (email link below GitHub Issues) keeps both channels together without adding a new card to an already dense grid. The card's `Card.Content` already renders a `flex flex-col gap-3` column, so the email link fits naturally as a second `ExternalLink`.

### Website: label text in `LandingContent`, not hardcoded

The email address itself (`support@autokpo.com`) is the same across locales and can be hardcoded in the component. The link label ("Kontakt", "Contact", "Контакт") must be localized — it belongs in `LandingContent` under a `support` field. This follows the same pattern as `legalLinks` (structure in the type, values in the locale objects).

### Website: place in `.footer-legal-links`, not a new row

The footer already has a `footer-legal-links` nav that groups legal/contact links. Adding the email there is the minimal, conventional placement. No CSS changes needed.

## Risks / Trade-offs

- **Email spam**: publishing a `mailto:` link exposes the address to harvesters. Acceptable for a support address — users expect it to be public. → No mitigation needed.
- **i18n extract hook**: the pre-commit hook runs `i18n:extract` and stages `.po` files automatically, but translations for `en` and `ru` must be filled manually before commit. → Translations are part of the task definition.

## Open Questions

_(none)_
