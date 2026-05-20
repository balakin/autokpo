## ADDED Requirements

### Requirement: `packages/emails` provides a build-time email template authoring environment

The monorepo SHALL contain a `packages/emails` package (`@autokpo/emails`) that houses React Email templates. The package SHALL be a dev-only tool — it SHALL NOT be listed as a runtime dependency of any other package. It SHALL expose `preview` and `build` scripts and produce rendered HTML artifacts in `dist/`.

#### Scenario: Build produces rendered HTML in dist/

- **WHEN** `pnpm build` is run in `packages/emails`
- **THEN** `tsc --noEmit` SHALL complete without type errors
- **AND** `email export` SHALL render all templates to `dist/<template-name>.html`

#### Scenario: Preview server starts for local development

- **WHEN** `pnpm preview` is run in `packages/emails`
- **THEN** the react-email dev server SHALL start and serve a live preview of all templates in the browser

#### Scenario: Turbo caches the build artifact

- **WHEN** no template source files have changed since the last build
- **THEN** Turbo SHALL restore `dist/**` from cache without re-running `email export`

### Requirement: OTP sign-in email template uses a Resend-compatible variable placeholder

The package SHALL contain an OTP sign-in email template component that accepts an `otp` prop typed as `string`. The build export SHALL render the component with the literal value `{{{OTP}}}` as the `otp` prop, producing an HTML file that Resend can use for triple-mustache variable substitution at send time.

#### Scenario: Exported HTML contains the OTP placeholder

- **WHEN** `email export` renders the OTP template
- **THEN** the output `dist/otp-email.html` SHALL contain the literal string `{{{OTP}}}` at the position where the sign-in code is displayed
