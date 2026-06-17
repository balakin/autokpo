## Context

AutoKPO has two public surfaces: the Astro website (`apps/website`) and the authenticated React app (`apps/app`). The website already uses localized copy maps, while the app uses Lingui catalogs plus static English metadata in `index.html` and the VitePWA manifest configuration.

The current English copy mixes several product descriptions: "KPO records", "KPO books", "Book of Achieved Turnover", and "generating the Serbian tax KPO". The selected product positioning is "KPO record-keeping for flat-rate entrepreneurs in Serbia" for external/product copy, with compact task-oriented labels preserved inside the app.

## Goals / Non-Goals

**Goals:**

- Align public and install metadata around one English product positioning phrase.
- Update localized landing copy in Serbian Latin, English, and Russian with equivalent terminology.
- Replace awkward literal English/Russian KPO explanations in app help/about copy.
- Keep compact UI labels close to their current length so navigation, cards, buttons, and forms do not shift unexpectedly.
- Preserve official/form terminology where the user is entering regulated taxpayer data.

**Non-Goals:**

- Redesign layouts or change component structure.
- Rename app routes, domain objects, database fields, or analytics events.
- Change legal document substance beyond titles/descriptions if they already remain accurate.
- Replace all occurrences of "taxpayer" with "flat-rate entrepreneur".
- Add a shared copy package or runtime copy service.

## Decisions

1. Use context-specific terminology rather than one phrase everywhere.

   External and explanatory surfaces SHALL use "flat-rate entrepreneur in Serbia" or equivalent localized phrasing. Official/form surfaces SHALL keep "taxpayer" where the field represents tax registration data. This avoids making labels longer and less precise.

   Alternative considered: replace all "taxpayer" labels with "flat-rate entrepreneur". Rejected because form labels such as TIN, taxpayer code, and taxpayer profile are official-data labels and the replacement is longer.

2. Keep the app metadata English-only.

   The app HTML shell and manifest are static and cannot reflect the active user locale before React loads. They will use the unified English positioning, matching the existing app OG requirement that static shell metadata is English.

   Alternative considered: generate locale-specific static app shells. Rejected as out of scope and unnecessary for this copy-only alignment.

3. Update source strings first, then regenerate catalogs.

   App UI strings live in source (`<Trans>`, `t`, `msg`) and are extracted to `.po` files. Any source copy changes should be followed by extraction and manual translation updates for `en` and `ru` catalogs.

   Alternative considered: edit only `.po` translations. Rejected because source locale is Serbian Latin and extraction would revert catalog-only changes.

4. Preserve visual length in compact UI.

   The implementation should prefer short variants for navigation, buttons, card titles, and shell links. Longer explanatory copy is acceptable in descriptions, help text, metadata, and landing body copy.

   Alternative considered: standardize all labels with the full phrase "flat-rate entrepreneur in Serbia". Rejected because it would cause layout churn and repetitive UI.

## Risks / Trade-offs

- Risk: Russian product wording becomes too long for compact marketing areas. → Mitigation: use full Russian wording in metadata/body copy and shorter variants in headings when needed.
- Risk: Changing source strings invalidates existing catalog entries. → Mitigation: run extraction and fill all affected `en` and `ru` translations in the same implementation.
- Risk: Existing tests assert exact copy. → Mitigation: update tests only where they intentionally verify affected copy or metadata.
- Risk: Legal/form terminology becomes less precise if over-unified. → Mitigation: explicitly preserve taxpayer terminology in regulated-data labels.
