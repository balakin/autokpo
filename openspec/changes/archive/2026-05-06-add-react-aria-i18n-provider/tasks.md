## 1. Provider integration

- [x] 1.1 Update `LocaleProvider` to render React Aria `I18nProvider` for descendants.
- [x] 1.2 Resolve React Aria provider locale from app locale using `INTL_LOCALES`.
- [x] 1.3 Preserve existing locale persistence and Lingui activation behavior while adding the new provider layer.

## 2. Runtime and test composition alignment

- [x] 2.1 Verify runtime provider hierarchy still matches i18n spec expectations with React Aria context nested in `LocaleProvider`.
- [x] 2.2 Update shared test render wrappers to mirror runtime locale provider composition.
- [x] 2.3 Ensure date-related UI tests run under deterministic app-selected locale context (not browser default fallback).

## 3. Validation

- [x] 3.1 Add or update tests to assert date/time components follow selected app locale after mount.
- [x] 3.2 Add or update tests to assert locale switching updates React Aria date/time rendering behavior.
- [x] 3.3 Run scoped tests for locale provider and entry form/date UI to confirm no regressions.
