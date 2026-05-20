## 1. Component Logic

- [x] 1.1 Define the three-tier error classification in `oauth-callback.tsx`: Tier 1 (`access_denied`), Tier 2 (`account_not_linked`, `email_not_found`, `state_mismatch`, `please_restart_the_process`, `missing_session`), Tier 3 (everything else)
- [x] 1.2 Replace the current `isAccountNotLinked` branch with the tiered rendering: Tier-1 and Tier-2 show specific messages with no code, Tier-3 shows a generic message with a small muted code block

## 2. i18n Strings

- [x] 2.1 Add `<Trans>` strings for Tier-1 (`access_denied`) message in `sr-Latn`
- [x] 2.2 Add `<Trans>` strings for Tier-2 messages (`email_not_found`, `state_mismatch`/`please_restart_the_process`, `missing_session`) in `sr-Latn`
- [x] 2.3 Add `<Trans>` string for the Tier-3 generic fallback message in `sr-Latn`
- [x] 2.4 Run `i18n:extract` and fill in translations for `en` and `ru` locales for all new strings

## 3. Tests

- [x] 3.1 Update existing `shows provider-aware heading and error code from query param` test — assert Tier-3 code appears in small muted element, not as `Kod: <code>`
- [x] 3.2 Add test: `access_denied` shows cancel message and no error code element
- [x] 3.3 Add test: `email_not_found` shows provider email guidance and no raw code
- [x] 3.4 Add test: `state_mismatch` shows session-expired message and no raw code
- [x] 3.5 Add test: `please_restart_the_process` shows session-expired message and no raw code
- [x] 3.6 Add test: `missing_session` shows retry message and no raw code
- [x] 3.7 Add test: unrecognized code shows generic message and small muted code element
