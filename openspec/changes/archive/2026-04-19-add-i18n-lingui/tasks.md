## 1. Setup & Configuration

- [x] 1.1 Install Lingui dependencies: `@lingui/core`, `@lingui/react`, `@lingui/cli`, `@lingui/vite-plugin`, `@lingui/babel-plugin-lingui-macro`, `eslint-plugin-lingui`
- [x] 1.2 Create `lingui.config.ts` with locales `['sr-Latn', 'en', 'ru']`, `sourceLocale: 'sr-Latn'`, PO format (default — no explicit `format` key), catalogs path `src/locales/{locale}`
- [x] 1.3 Add `@lingui/vite-plugin` + `@lingui/babel-plugin-lingui-macro` to `vite.config.ts` (Lingui macro plugin and React Compiler preset both run inside `@rolldown/plugin-babel`)
- [x] 1.4 Add script to `package.json`: `"i18n:extract": "lingui extract --clean"`; no `i18n:compile` script needed — `@lingui/vite-plugin` compiles on-the-fly with `failOnMissing: true` and `failOnCompileError: true`
- [x] 1.5 Configure `eslint-plugin-lingui` in ESLint config with `flat/recommended` config, `consistent-plural-format: 'warn'`, and `no-plural-inside-trans: 'warn'` (the `no-unlocalized-strings` rule is intentionally excluded due to false positives with HeroUI and Tailwind)
- [x] 1.6 Add `pnpm i18n:extract` and `git add src/locales/` to the pre-commit hook (`.husky/pre-commit`); no `lingui compile --strict` step — completeness is enforced by `@lingui/vite-plugin`'s `failOnMissing` option
- [x] 1.7 Configure TypeScript for Lingui macro types — no changes needed; `@lingui/core/macro` and `@lingui/react/macro` ship with proper subpath exports

## 2. Locale Infrastructure

- [x] 2.1 Create `src/i18n/` module with: `i18n.ts` (Lingui init + catalog loading), `locale-context.tsx` (locale state + `localStorage` persistence), `use-locale.ts` (hook exposing `locale` and `setLocale`)
- [x] 2.2 Created `lingui.config.ts` with PO format catalogs at `src/locales/{locale}`, ran `pnpm i18n:extract` to generate initial locale catalogs
- [x] 2.3 Added `I18nProvider` and `LocaleProvider` to `main.tsx` provider hierarchy: `StrictMode → I18nProvider → LocaleProvider → ThemeProvider → Toast.Provider → BooksProvider → RouterProvider`

## 3. String Extraction — Component by Component

- [x] 3.1 Extract strings from `src/app-shell/sidebar.tsx` — nav labels ("Panel", "Knjige", "Podešavanja"), aria-labels, version badge text
- [x] 3.2 Extract strings from `src/app-shell/top-bar.tsx` — breadcrumb labels, aria-label ("Otvori meni")
- [x] 3.3 Extract strings from `src/app-shell/mobile-drawer.tsx` — aria-labels ("Navigacija", "Zatvori")
- [x] 3.4 Extract strings from `src/dashboard/dashboard-page.tsx` — stat labels, card titles, empty state text, button labels
- [x] 3.5 Extract strings from `src/books/book-library.tsx` — empty state, status chip, count suffix (with pluralization), action labels, delete confirmation dialog
- [x] 3.6 Extract strings from `src/books/add-book-modal.tsx` — modal title, description, placeholder, label, suffix "(zauzeto)", button labels
- [x] 3.7 Extract strings from `src/entries/entries-table.tsx` — column headers, empty state, edit/delete tooltips, delete confirmation dialog
- [x] 3.8 Extract strings from `src/entries/entry-form.tsx` — form labels ("Datum prometa", "Opis prometa", "Od prodaje proizvoda", "Od izvršenih usluga"), currency suffix "RSD"
- [x] 3.9 Extract strings from `src/entries/entry-modal.tsx` — modal heading (conditional "Uredi unos" / "Novi unos"), descriptions, button labels
- [x] 3.10 Extract strings from `src/entity-profiles/entity-profile-form.tsx` — toast message "Profil je sačuvan", form labels (PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, Šifra delatnosti)
- [x] 3.11 Extract strings from `src/entity-profiles/entity-profile-preview.tsx` — card heading "Podaci o obvezniku", definition terms, edit modal labels
- [x] 3.12 Extract strings from `src/signatures/signature-form.tsx` — toast "Potpis je sačuvan", labels (Sastavio, Odgovorno lice)
- [x] 3.13 Extract strings from `src/signatures/signature-preview.tsx` — card heading, definition terms, edit modal labels
- [x] 3.14 Extract strings from `src/setup-wizard/start-step.tsx` — heading, body text, step descriptions, button "Počinite"
- [x] 3.15 Extract strings from `src/setup-wizard/wizard-stepper.tsx` — step labels (Početak, Profil, Potpis)
- [x] 3.16 Extract strings from `src/setup-wizard/unsaved-changes-dialog.tsx` — dialog heading, body, button labels (Ostanite, Napustite)
- [x] 3.17 Extract strings from `src/working-layout/working-layout.tsx` — tab labels, aria-labels, alert text (legal reference), button labels
- [x] 3.18 Extract strings from `src/settings/settings-page.tsx` — section titles, select options (Svetla/Tamna/Sistemska), descriptions, button labels
- [x] 3.19 Extract strings from `src/pwa/offline-indicator.tsx` — toast title and description
- [x] 3.20 Extract strings from `src/pdf/download-pdf-button.tsx` — button label "Preuzmi PDF" (this file IS internationalized; only `src/pdf/` PDF generation internals are excluded)

## 4. Zod Schema Factory Pattern

- [x] 4.1 Convert `src/entries/entries-schema.ts` — added `createKpoEntrySchema()` and `createEntryFormSchema()` factories using `t` from `@lingui/core/macro` (no args — `t` resolves against active locale at call time); kept base `kpoEntrySchema` without messages for `bookSchema` composition
- [x] 4.2 Convert `src/entity-profiles/entity-profile-schema.ts` — added `createEntityProfileSchema()` factory; kept base `entityProfileSchema` for `bookSchema`
- [x] 4.3 Convert `src/signatures/signature-schema.ts` — added `createSignatureSchema()` factory; kept base `signatureSchema` for `bookSchema`
- [x] 4.4 Extract inline Zod validations from `src/books/add-book-modal.tsx` into `createAddBookFormSchema()` factory
- [x] 4.5 Extract inline Zod validations from `src/entries/entry-form.tsx` into `createEntryFormSchema()` in entries-schema.ts; moved `EntryFormData` and `EntryModelData` types there
- [x] 4.6 Updated all `useForm` + `zodResolver` call sites to call factories with no arguments: `createEntryFormSchema()`, `createEntityProfileSchema()`, `createSignatureSchema()`, `createAddBookFormSchema()`

## 5. Pluralization

- [x] 5.1 Added plural rules for Serbian (`one/few/many/other`) and Russian (`one/few/many/other`) via Lingui's `<Plural>` macro in `book-library.tsx` and `dashboard-page.tsx`
- [x] 5.2 Converted count-dependent strings to use `<Plural>` component with `one="# unos"`, `few="# unosa"`, `many="# unosa"`, `other="# unosa"`

## 6. Locale Switching UI

- [x] 6.1 Implement the locale selector in `settings-page.tsx` — HeroUI `Select` with options "Srpski" (sr-Latn), "English" (en), "Русский" (ru)
- [x] 6.2 Wire the selector to `useLocale()` hook — changing selection calls `setLocale()` which persists to `localStorage` and activates the new catalog
- [x] 6.3 Replace the hardcoded "Trenutni jezik: Srpski" description with a translatable string reflecting the current locale name

## 7. Translation Completion

- [x] 7.1 Run `pnpm i18n:extract` to populate base `sr-Latn.po` catalog with all extracted keys
- [x] 7.2 Fill in English (`en.po`) translations for all keys
- [x] 7.3 Fill in Russian (`ru.po`) translations for all keys
- [x] 7.4 Verify the application renders correctly in all three locales (catalog compilation is handled on-the-fly by `@lingui/vite-plugin`)

## 8. Testing

- [x] 8.1 Add test for `LocaleProvider` initialization — locale loads from `localStorage`, defaults to `sr-Latn` (covers `I18nProvider` initialization)
- [x] 8.2 Add test for locale switching — selecting a new locale persists to `localStorage` and re-renders with translated strings
- [x] 8.3 Add test for `Settings` page locale selector — renders three options, switches locale on selection
- [x] 8.4 Add test for Zod schema factory — validation messages appear in the active locale
- [x] 8.5 Verify `@lingui/vite-plugin` `failOnMissing` fails the build when a locale has missing translations
- [x] 8.6 Verify ESLint `lingui/consistent-plural-format` and `lingui/no-plural-inside-trans` rules flag common i18n mistakes
