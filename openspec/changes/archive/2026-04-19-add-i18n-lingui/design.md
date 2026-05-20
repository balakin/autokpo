## Context

KPO is a client-side-only PWA for Serbian tax bookkeeping. All ~120 UI strings are hardcoded in Serbian (Latin script). The app has no i18n infrastructure. The Settings page has a non-functional "Jezik" (Language) placeholder. The PDF module (`src/pdf/`) and `formatters.ts` use Serbian (Cyrillic) legal form text and Serbian locale number/date formatting respectively — these are regulatory requirements and must not be internationalized.

The provider hierarchy is: `StrictMode → ThemeProvider → Toast.Provider → BooksProvider → RouterProvider → (feature providers)`.

Target languages: `sr-Latn` (base), `en`, `ru`.

## Goals / Non-Goals

**Goals:**

- Support 3 locales: Serbian Latin (`sr-Latn`), English (`en`), Russian (`ru`)
- Extract all ~120 UI strings from components, Zod schemas, aria-labels, and toasts into Lingui catalogs
- Enable runtime locale switching persisted to `localStorage`
- Enforce translation completeness via `@lingui/vite-plugin` with `failOnMissing` and `failOnCompileError` options, and `eslint-plugin-lingui` recommended config + `consistent-plural-format` and `no-plural-inside-trans` warnings
- Use PO catalog format for standard tooling compatibility and translator-friendly workflow
- Provide a factory pattern for Zod schemas to receive a translation function

**Non-Goals:**

- Internationalizing the PDF module (`src/pdf/`) — legal form text must remain in Serbian Cyrillic
- Internationalizing `formatters.ts` — number/date formatting stays in Serbian locale
- URL-based locale routing (`/en/dashboard`) — locale is a user preference, not a route dimension
- Server-side rendering or runtime catalog fetching — all catalogs are bundled at build time
- Right-to-left (RTL) layout support — none of the target languages require it

## Decisions

### 1. Lingui over react-i18next and typesafe-i18n

**Chosen**: Lingui

**Rationale**:

- Macro-based automatic extraction (`lingui extract`) eliminates manual key management
- ICU MessageFormat handles Serbian (`one/few/many/other`) and Russian plural rules natively
- `lingui extract --clean` provides CI enforcement of completeness
- `@lingui/vite-plugin` with `failOnMissing: true` and `failOnCompileError: true` enforces completeness at build/dev time
- `eslint-plugin-lingui` recommended config plus `consistent-plural-format` and `no-plural-inside-trans` rules catch common i18n mistakes
- 3KB runtime vs react-i18next's ~40KB
- `i18n._()` works outside React context — solves both Zod and PDF module challenges
- PO format support with full plural form metadata — optimal for Serbian and Russian plural rules

**Alternatives considered**:

- **react-i18next**: Largest ecosystem, but no automatic extraction, larger bundle, JSON-only, complex TypeScript setup
- **typesafe-i18n**: Best TypeScript DX and smallest runtime, but no automatic extraction, TS translation files (no standard tooling support), manual plural config, smaller community

### 2. Catalog format: PO

**Chosen**: `format: 'po'` in `lingui.config.ts`

**Rationale**: PO (Portable Object) is the industry-standard format for translation catalogs with broad tooling support (Poedit, Weblate, GNU gettext). It preserves translator comments, source references, and plural forms natively — better fit for Serbian and Russian plural rules than flat JSON.

**File structure**:

```
src/locales/
  sr-Latn.po    # base language (Serbian Latin)
  en.po          # English
  ru.po          # Russian
```

### 3. Zod schema factory pattern

**Chosen**: Wrap Zod schemas in factory functions that use `t` from `@lingui/core/macro`

**Rationale**: Zod schemas run outside React context. Using `t` from `@lingui/core/macro` (not module-scope `i18n._()`), the `t` tag evaluates against the active locale at call time. Factories take no arguments — `t` is imported from the macro and resolved lazily on each call.

```tsx
// Before
const entrySchema = z.object({ ... })

// After
import { t } from '@lingui/core/macro';

export function createEntrySchema() {
  return z.object({
    date: z.string().min(1, t`Polje je obavezno`),
    ...
  });
}
```

Consumers: `useForm({ resolver: zodResolver(createEntrySchema()) })`

### 4. React Compiler compatibility with Lingui macros

**Decision**: Use `@lingui/babel-plugin-lingui-macro` via `@rolldown/plugin-babel` alongside React Compiler's Babel preset. Both run in the same Babel pass inside `@rolldown/plugin-babel`: `plugins: ['@lingui/babel-plugin-lingui-macro']` and `presets: [reactCompilerPreset()]`. `@lingui/vite-plugin` handles HMR. This avoids the need for a separate SWC plugin.

**Ordering guarantee**: Lingui requires that its macro plugin expands macros before React Compiler processes the code. This is satisfied automatically by Babel's execution order — plugins always run before presets ([babeljs.io/docs/plugins#plugin-ordering](https://babeljs.io/docs/plugins#plugin-ordering)) — so `@lingui/babel-plugin-lingui-macro` (in `plugins`) always runs before `reactCompilerPreset()` (in `presets`).

### 5. Provider placement

**Decision**: `I18nProvider` wraps the app inside `StrictMode` but outside `ThemeProvider`. Locale is loaded from `localStorage` on init, falls back to `sr-Latn`.

```
StrictMode
  → I18nProvider       ← NEW
    → LocaleProvider   ← NEW (locale state + localStorage persistence)
      → ThemeProvider
        → Toast.Provider (self-closing)
        → BooksProvider
          → RouterProvider
```

### 6. Excluded modules

**Decision**: `src/pdf/` internals (PDF generation logic) and `src/formatters.ts` are excluded from i18n — no `<Trans>`, `t`, or `i18n._` calls. PDF text is Serbian Cyrillic by legal requirement. Formatters use fixed Serbian locale conventions. However, `src/pdf/download-pdf-button.tsx` IS internationalized because it contains user-facing button text ("Preuzmi PDF"), not legal form content.

## Risks / Trade-offs

- **[Lingui macro + React Compiler conflict]** → Mitigated by running `@lingui/babel-plugin-lingui-macro` and React Compiler preset in the same `@rolldown/plugin-babel` pass.
- **[Zod factory boilerplate]** → Each schema file becomes a factory function. Acceptable trade-off for locale-aware validation. The factory pattern is minimal overhead (~5 lines per schema).
- **[Catalog sync drift]** → `@lingui/vite-plugin` with `failOnMissing: true` fails the build if any catalog entry has empty translations. The pre-commit hook runs `i18n:extract` and auto-stages updated catalogs. `eslint-plugin-lingui` recommended rules catch common macro misuse.
- **[Bundle size increase]** → Three locale catalogs bundled. With ~120 strings, PO catalogs compile to small TypeScript modules. Acceptable for a PWA. Lazy-loading per locale is possible later if needed.
- **[Pluralization complexity]** → Serbian and Russian have complex plural rules. ICU MessageFormat handles these, but translators must use correct plural forms. AI translation handles this well for major languages.

## Open Questions

- None at this time. All key decisions are resolved.
