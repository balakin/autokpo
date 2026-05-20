## ADDED Requirements

### Requirement: Inter loaded from local assets

The app SHALL load the Inter typeface exclusively from files hosted within the app's own origin. No requests to third-party servers (e.g. Google Fonts, fonts.gstatic.com) SHALL be made for font delivery.

#### Scenario: No external font requests on page load

- **WHEN** the app is loaded in a browser
- **THEN** no network requests are made to any domain other than the app's own origin for font files

### Requirement: Variable font files in versioned subfolders

Font files SHALL be organised under `public/fonts/<family>/` so that each family can carry its own license file. The Inter family SHALL use the variable font format (woff2) covering the full weight (`wght`) and optical-size (`opsz`) axes.

#### Scenario: Inter font files present

- **WHEN** the built app is served
- **THEN** the following files are accessible:
  - `/fonts/inter/InterVariable.woff2`
  - `/fonts/inter/InterVariable-Italic.woff2`
  - `/fonts/inter/OFL.txt`

#### Scenario: PT Serif files relocated

- **WHEN** the built app is served
- **THEN** PT Serif files are accessible at `/fonts/pt-serif/PTSerif-Regular.ttf` and `/fonts/pt-serif/PTSerif-Bold.ttf`
- **THEN** the old paths `/fonts/PTSerif-*.ttf` are no longer served

### Requirement: Inter used as the UI sans-serif

The global CSS SHALL declare `@font-face` rules for Inter and the Tailwind `font-sans` token SHALL resolve to `'Inter', sans-serif`, so every UI element inherits Inter by default.

#### Scenario: Inter applied to body text

- **WHEN** the app renders any text not explicitly styled with another font
- **THEN** the computed font-family is Inter (variable)

### Requirement: PDF export unaffected

The PDF export SHALL continue to use PT Serif at its updated paths. No visual change to generated PDFs SHALL occur.

#### Scenario: PDF font loads correctly after path change

- **WHEN** a PDF is generated
- **THEN** the PDF renders PT Serif (not a fallback font) for all body text
