## Context

The app is currently named "KPO" — the same abbreviation as the Serbian tax form "Knjiga prihoda i rashoda" (КНИПРО). This creates an ambiguity: "KPO" in the codebase refers to both the tax form and the app identity. The app is not yet published, so this is the right time to rename without data migration concerns.

The rename affects: page title, sidebar branding, localStorage key prefixes, package/worker names, React devtools display names, and documentation. References to "KPO" that mean the tax form (КПО) are intentionally left unchanged.

## Goals / Non-Goals

**Goals:**

- Rename all app-identity references from "KPO" to "AutoKPO"
- Change localStorage key prefix from `kpo:` to `autokpo:` without migration
- Update package name and Cloudflare worker name
- Update React devtools display names
- Update documentation (AGENTS.md, CLAUDE.md)
- Preserve all tax-form references (КПО in PDF, kpo.pdf, KpoEntry, kpoEntrySchema, KpoDocument, KPO_FIRST_YEAR, "KPO unosi", kpo-\*.tsx files)

**Non-Goals:**

- Renaming tax-form-related identifiers (KpoEntry, kpoEntrySchema, KpoDocument, etc.)
- Data migration from old localStorage keys
- Renaming file names like `kpo-document.tsx`, `kpo-page-header.tsx`, etc.
- Changing the Cyrillic PDF title КПО
- Changing the PDF download filename `kpo.pdf`

## Decisions

### D1: No localStorage migration

Since the app is not published, there are no existing users with data in localStorage. We simply rename the prefix from `kpo:` to `autokpo:`. A fresh start is acceptable.

### D2: KpoEntry and related identifiers stay

Identifiers like `KpoEntry`, `kpoEntrySchema`, `KpoDocument`, `KpoPageHeader`, `KpoTableHeader`, `KpoEntryRow`, `KpoTotalsRow`, `KpoSignature` all refer to the tax form entity, not the app. File names like `kpo-document.tsx`, `kpo-page-header.tsx`, etc. follow the same convention. These stay unchanged.

### D3: KPO_FIRST_YEAR stays

The constant `KPO_FIRST_YEAR` refers to the earliest year the KPO tax form covers — a domain concept, not an app name. It stays.

### D4: "KPO unosi" stays

The i18n string `msgid "KPO unosi"` means "KPO entries" — it refers to entries of the KPO tax form, not entries of the app. The string stays as-is in all locale catalogs.

### D5: Sidebar branding changes to "AutoKPO"

The sidebar currently shows "KPO" as the app logo. This becomes "AutoKPO".

### D6: Stepper displayNames change

React devtools names like `KPO.Stepper` become `AutoKPO.Stepper.*` since they identify the app's UI component library, not the tax form.

### D7: Package and worker name change

`package.json` `"name": "kpo"` → `"autokpo"` and `wrangler.jsonc` `"name": "kpo"` → `"autokpo"`.
