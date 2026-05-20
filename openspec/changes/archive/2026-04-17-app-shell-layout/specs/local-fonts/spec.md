## MODIFIED Requirements

### Requirement: Manrope loaded from local assets

The app SHALL load the Manrope typeface exclusively from files hosted within the app's own origin. No requests to third-party servers (e.g. Google Fonts, fonts.gstatic.com) SHALL be made for font delivery.

#### Scenario: No external font requests on page load

- **WHEN** the app is loaded in a browser
- **THEN** no network requests are made to any domain other than the app's own origin for font files

### Requirement: JetBrains Mono loaded from local assets

The app SHALL load the JetBrains Mono typeface exclusively from files hosted within the app's own origin for use in tabular and financial number contexts.

#### Scenario: JetBrains Mono font files present

- **WHEN** the built app is served
- **THEN** the JetBrains Mono woff2 files SHALL be accessible at `/fonts/jetbrains-mono/`

### Requirement: Variable font files in versioned subfolders

Font files SHALL be organised under `public/fonts/<family>/` so that each family can carry its own license file. The Manrope family SHALL use the variable font format (woff2) covering the full weight (`wght`) axis. The JetBrains Mono family SHALL use the variable font format (woff2) covering weight and width axes.

#### Scenario: Manrope font files present

- **WHEN** the built app is served
- **THEN** the following files are accessible:
  - `/fonts/manrope/Manrope-Variable.woff2`
  - `/fonts/manrope/OFL.txt`

#### Scenario: JetBrains Mono font files present

- **WHEN** the built app is served
- **THEN** the following files are accessible:
  - `/fonts/jetbrains-mono/JetBrainsMono-Variable.woff2`
  - `/fonts/jetbrains-mono/OFL.txt`

### Requirement: Manrope used as the UI sans-serif

The global CSS SHALL declare `@font-face` rules for Manrope and the Tailwind `font-sans` token SHALL resolve to `'Manrope', sans-serif`, so every UI element inherits Manrope by default.

#### Scenario: Manrope applied to body text

- **WHEN** the app renders any text not explicitly styled with another font
- **THEN** the computed font-family is Manrope (variable)

### Requirement: JetBrains Mono used for tabular and financial numbers

The global CSS SHALL declare a `font-mono` token resolving to `'JetBrains Mono', monospace`. Financial numbers (entry amounts, totals, year labels) SHALL use the `font-mono` class.

#### Scenario: Financial numbers use monospace font

- **WHEN** the app renders an entry amount or year label
- **THEN** the computed font-family is JetBrains Mono

### Requirement: PDF export unaffected

The PDF export SHALL continue to use PT Serif at its current paths. No visual change to generated PDFs SHALL occur.

#### Scenario: PDF font loads correctly after font change

- **WHEN** a PDF is generated
- **THEN** the PDF renders PT Serif (not a fallback font) for all body text
