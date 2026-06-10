# website-sitemap-robots Specification

## Purpose

XML sitemap and robots.txt for autokpo.com, covering all indexable pages across sr-Latn, en, and ru locales.

## Requirements

### Requirement: XML sitemap is generated at build time

The website build SHALL generate an XML sitemap covering all indexable pages across all supported locales, using the `@astrojs/sitemap` integration.

#### Scenario: Sitemap index is present in build output

- **WHEN** the website production build runs
- **THEN** the `dist/` directory contains `/sitemap-index.xml` and `/sitemap-0.xml`

#### Scenario: Sitemap covers all locale variants of landing pages

- **WHEN** a crawler fetches `/sitemap-0.xml`
- **THEN** the sitemap includes entries for `/`, `/en/`, and `/ru/`

#### Scenario: Sitemap covers all locale variants of legal pages

- **WHEN** a crawler fetches `/sitemap-0.xml`
- **THEN** the sitemap includes entries for `/privacy/`, `/terms/`, `/en/privacy/`, `/en/terms/`, `/ru/privacy/`, and `/ru/terms/`

#### Scenario: Sitemap excludes the 404 page

- **WHEN** a crawler fetches `/sitemap-0.xml`
- **THEN** the sitemap does not include the `/404` page

#### Scenario: Sitemap includes alternate-language links

- **WHEN** a crawler fetches `/sitemap-0.xml`
- **THEN** each URL entry contains `xhtml:link rel="alternate"` tags for all three locale variants of that page

### Requirement: robots.txt allows all crawlers and references sitemap

The website SHALL serve a `robots.txt` at the root that permits all user agents and declares the sitemap location.

#### Scenario: robots.txt allows all crawlers

- **WHEN** a crawler fetches `https://autokpo.com/robots.txt`
- **THEN** the response contains `User-agent: *` and `Allow: /`

#### Scenario: robots.txt references sitemap

- **WHEN** a crawler fetches `https://autokpo.com/robots.txt`
- **THEN** the response contains `Sitemap: https://autokpo.com/sitemap-index.xml`
