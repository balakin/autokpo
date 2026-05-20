## Why

The app needs a distinct identity separate from the "KPO" (КНИПРО) tax form it generates. "AutoKPO" communicates automation while keeping the connection to the form. Since the app is not yet published, this is the right time to rename without migration concerns.

## What Changes

- **BREAKING**: Rename all app-identity references from "KPO" to "AutoKPO" — page title, sidebar branding, localStorage keys, package name, worker name, React display names
- **BREAKING**: Change localStorage key prefix from `kpo:` to `autokpo:` (no migration — app is not published)
- Leave all references that use "KPO" in the context of the КНИПРО tax form unchanged (PDF title `КПО`, filename `kpo.pdf`, type names like `KpoEntry`, `kpoEntrySchema`, component names like `KpoDocument`, `KpoPageHeader`, file names like `kpo-*.tsx`, constant `KPO_FIRST_YEAR`, UI string "KPO unosi")
- Update all i18n catalogs after source string changes

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `app-shell`: Sidebar branding and page title change from "KPO" to "AutoKPO"
- `settings`: localStorage key prefix changes from `kpo:theme` to `autokpo:theme`
- `i18n`: No string content changes (the "KPO unosi" string stays), but catalog regeneration is needed after the rename touches source files

## Impact

- **Config**: `package.json` name, `wrangler.jsonc` name
- **Source**: `index.html`, `sidebar.tsx`, `locale-provider.tsx`, `theme-provider.tsx`, `books-storage.ts`, `constants.ts`, stepper display names
- **Tests**: Test files referencing the old names
- **Docs**: `AGENTS.md`, `CLAUDE.md`
