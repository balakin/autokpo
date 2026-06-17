## MODIFIED Requirements

### Requirement: Web manifest metadata

The system SHALL provide a web app manifest with AutoKPO-specific install metadata including name, short name, description, stable app identity, launch URL, scope, display mode, categories, and icons. The manifest description SHALL use the unified English product positioning for KPO record-keeping by flat-rate entrepreneurs in Serbia. The manifest SHALL NOT include static theme color, background color, language, or shortcut metadata.

#### Scenario: Browser reads manifest

- **WHEN** a browser requests the web app manifest
- **THEN** the manifest includes `name: AutoKPO`, `short_name: AutoKPO`, `description: AutoKPO — KPO record-keeping for flat-rate entrepreneurs in Serbia. Yearly books, income entries, PDF export, and encrypted sync across devices.`, `id`, `start_url`, `scope`, `display: standalone`, categories, and icon entries for 192x192 and 512x512 PNG assets

#### Scenario: Manifest avoids runtime-specific metadata

- **WHEN** a browser requests the web app manifest
- **THEN** the manifest does not include `theme_color`, `background_color`, `lang`, or `shortcuts`
