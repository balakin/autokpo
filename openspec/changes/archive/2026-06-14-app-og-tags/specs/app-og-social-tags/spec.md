## ADDED Requirements

### Requirement: App HTML shell includes Open Graph meta tags

`apps/app/index.html` SHALL include `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:site_name">`, `<meta property="og:type">`, `<meta property="og:url">`, `<meta property="og:image">`, and `<meta name="twitter:card">` in `<head>` so that social crawlers (Facebook, Twitter/X, Slack, LinkedIn, iMessage) render a link preview with image and description when sharing `https://app.autokpo.com`. Title and description SHALL be in English — the static HTML shell cannot be localized per user locale.

#### Scenario: Social crawler fetches app shell

- **WHEN** a social crawler (e.g., Facebook's `facebookexternalhit` bot) fetches `https://app.autokpo.com`
- **THEN** the response SHALL contain `<meta property="og:title" content="AutoKPO">`, `<meta property="og:description" content="AutoKPO — local-first web app for generating the Serbian tax Knjiga o ostvarenom prometu (KPO — Book of Achieved Turnover). Syncs across devices.">`, `<meta property="og:site_name" content="AutoKPO">`, `<meta property="og:type" content="website">`, `<meta property="og:url" content="https://app.autokpo.com">`, `<meta property="og:image" content="https://app.autokpo.com/og-image.png">`, and `<meta name="twitter:card" content="summary">`

#### Scenario: Existing SEO tags are preserved

- **WHEN** the app HTML shell is rendered
- **THEN** the existing `<meta name="robots" content="noindex, nofollow">` and `<title>AutoKPO</title>` SHALL remain unchanged

### Requirement: App HTML shell includes a meta description

`apps/app/index.html` SHALL include a `<meta name="description">` tag with a concise description of the AutoKPO app for search engine snippets and link previews.

#### Scenario: Meta description present

- **WHEN** any crawler or browser parses the app shell
- **THEN** `<meta name="description" content="AutoKPO — local-first web app for generating the Serbian tax Knjiga o ostvarenom prometu (KPO — Book of Achieved Turnover). Syncs across devices.">` SHALL be present in `<head>`
