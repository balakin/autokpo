## ADDED Requirements

### Requirement: BaseLayout emits Open Graph meta tags when props provided

`base-layout.astro` SHALL accept optional props `ogType`, `ogUrl`, `ogImage`, and `twitterCard`. When provided, it SHALL emit the corresponding `<meta property="og:*">` and `<meta name="twitter:*">` tags inside `<head>`. It SHALL always emit `og:title` (from `title` prop), `og:description` (from `description` prop), and `og:site_name` ("AutoKPO") when any OG prop is passed.

#### Scenario: All OG props passed

- **WHEN** `base-layout.astro` renders with `ogType="website"`, `ogUrl="https://autokpo.com/en/"`, `ogImage="https://autokpo.com/og-en.png"`, and `twitterCard="summary_large_image"`
- **THEN** the rendered HTML `<head>` SHALL contain `<meta property="og:type" content="website">`, `<meta property="og:url" content="https://autokpo.com/en/">`, `<meta property="og:image" content="https://autokpo.com/og-en.png">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:site_name" content="AutoKPO">`, and `<meta name="twitter:card" content="summary_large_image">`

#### Scenario: No OG props passed

- **WHEN** `base-layout.astro` renders without any OG props (e.g. a page that opts out)
- **THEN** no `og:*` or `twitter:*` meta tags SHALL appear in the rendered HTML

#### Scenario: ogImage omitted but other props present

- **WHEN** `ogType` and `ogUrl` are passed but `ogImage` is not
- **THEN** `og:type` and `og:url` SHALL be emitted and no `og:image` tag SHALL appear

### Requirement: Landing pages pass full OG props

`landing-page.astro` SHALL pass `ogType="website"`, `ogUrl` (the computed canonical absolute URL), `ogImage` pointing to the shared social image (`https://autokpo.com/og-image.png`), and `twitterCard="summary_large_image"` to `BaseLayout`.

#### Scenario: Landing page renders OG tags with shared image

- **WHEN** any locale's landing page renders
- **THEN** the HTML SHALL contain `<meta property="og:type" content="website">`, `<meta property="og:image" content="https://autokpo.com/og-image.png">`, and `<meta name="twitter:card" content="summary_large_image">`

### Requirement: Legal pages pass minimal OG props

`legal-document-layout.astro` SHALL pass `ogType="article"`, `ogUrl` (the computed canonical absolute URL), `ogImage` pointing to the shared social image (`https://autokpo.com/og-image.png`), and `twitterCard="summary"` to `BaseLayout`.

#### Scenario: Privacy page renders article OG tags

- **WHEN** any locale's privacy page renders
- **THEN** the HTML SHALL contain `<meta property="og:type" content="article">`, `<meta property="og:image" content="https://autokpo.com/og-image.png">`, and `<meta name="twitter:card" content="summary">`
