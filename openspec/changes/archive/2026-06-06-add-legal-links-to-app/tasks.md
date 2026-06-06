## 1. Shared Legal Links

- [x] 1.1 Add an app-side helper for localized `https://autokpo.com` Terms, Privacy, and Cookies URLs with fallback to Serbian Latin routes.
- [x] 1.2 Add unit tests covering `sr-Latn`, `en`, `ru`, and unsupported-locale fallback URL mappings.

## 2. Sign-in Notice

- [x] 2.1 Add a localized Terms/Privacy notice to the `/sign-in` card near the sign-in actions.
- [x] 2.2 Wire the sign-in notice Terms and Privacy anchors to active-locale legal URLs and ensure they open externally.
- [x] 2.3 Update auth entry tests to assert the notice text, Terms/Privacy links, absence of Cookies in the notice, and no checkbox requirement.

## 3. Footer Legal Navigation

- [x] 3.1 Add compact Terms, Privacy, and Cookies links to `AuthShell` footer while preserving the existing AGPL/source notice.
- [x] 3.2 Add compact Terms, Privacy, and Cookies links to `EncryptionShell` footer while preserving the existing AGPL/source notice.
- [x] 3.3 Update shell/footer tests to assert legal link visibility, active-locale hrefs, and external-link attributes.

## 4. Help Page Legal Section

- [x] 4.1 Add a Help page legal/privacy card with Terms, Privacy, and Cookies links using the existing card/list composition style.
- [x] 4.2 Wire Help page legal links to active-locale URLs and external-link attributes.
- [x] 4.3 Update Help page tests to assert the legal/privacy section and localized document hrefs.

## 5. Localization and Verification

- [x] 5.1 Extract new Lingui messages and fill Serbian Latin, English, and Russian catalog translations.
- [x] 5.2 Run targeted auth, encryption shell, legal link helper, and Help page tests with Vitest verbose reporter.
- [x] 5.3 Run app build or typecheck to verify TypeScript, Lingui catalogs, and routing compile successfully.
