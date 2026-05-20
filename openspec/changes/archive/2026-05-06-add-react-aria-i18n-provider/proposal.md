## Why

Date and calendar widgets currently do not consistently follow the app-selected locale, even though translated UI strings do. This creates a mixed-language experience (for example, date segments/weekdays following browser locale while labels follow app locale) and makes locale switching feel incomplete.

## What Changes

- Add locale propagation from the app's locale state into React Aria date/time internationalization context.
- Ensure HeroUI date-based components (for example `DatePicker` + `Calendar`) use the selected app locale for formatting and calendar labels.
- Align test provider composition with runtime provider composition so date locale behavior is validated in tests.

## Capabilities

### New Capabilities

- `react-aria-locale-bridge`: Provide React Aria locale context derived from app locale state for date/time UI.

### Modified Capabilities

- `i18n`: Locale selection requirements extend to include date/time component locale behavior, not only translated message catalogs.

## Impact

- Affected code: i18n provider composition at app root and shared test render helpers.
- Affected UI: HeroUI date/calendar rendering behavior in entry-related forms and any future date/time controls.
- Dependencies/systems: React Aria `I18nProvider` integration with existing locale mapping (`INTL_LOCALES`) and context providers.
