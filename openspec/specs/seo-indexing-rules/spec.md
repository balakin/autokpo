## ADDED Requirements

### Requirement: 404 page is excluded from search engine indexing

The `404.astro` page SHALL include `<meta name="robots" content="noindex">` in its `<head>` so search engines do not index it.

#### Scenario: 404 page renders with noindex

- **WHEN** the 404 page renders
- **THEN** the HTML `<head>` SHALL contain `<meta name="robots" content="noindex">`

#### Scenario: Indexable pages are unaffected

- **WHEN** any landing or legal page renders
- **THEN** no `<meta name="robots">` tag SHALL appear (defaults to index,follow)

### Requirement: robots.txt contains only the sitemap pointer

`public/robots.txt` SHALL contain only the sitemap line (`Sitemap: https://autokpo.com/sitemap-index.xml`) with no `User-agent` or `Allow`/`Disallow` directives, since crawler access is managed by Cloudflare.

#### Scenario: robots.txt content

- **WHEN** a crawler fetches `https://autokpo.com/robots.txt`
- **THEN** the response SHALL contain `Sitemap: https://autokpo.com/sitemap-index.xml` and SHALL NOT contain `User-agent` or `Allow` directives
