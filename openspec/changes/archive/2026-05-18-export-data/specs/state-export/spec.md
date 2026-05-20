## ADDED Requirements

### Requirement: User can export local app state as JSON

The system SHALL allow a signed-in user to download all local app data as a single JSON file from the general settings Data section. The export SHALL read directly from the in-memory Y.Doc and SHALL NOT require a network connection. The file SHALL be named `autokpo-state-YYYY-MM-DD.json` where the date is the local date at export time.

#### Scenario: Export button triggers download

- **WHEN** the user presses the "Izvezi podatke" button in the general settings Data card
- **THEN** the browser SHALL download a file named `autokpo-state-<date>.json`
- **AND** the file SHALL be valid JSON

#### Scenario: Export works offline

- **WHEN** the user is offline and presses "Izvezi podatke"
- **THEN** the download SHALL still succeed without any network request

#### Scenario: Export with no books produces empty books array

- **WHEN** the user has created no books and presses "Izvezi podatke"
- **THEN** the exported JSON SHALL contain `"books": []`

### Requirement: State export JSON structure

The exported JSON SHALL contain the following top-level fields:

- `exportedAt`: ISO 8601 timestamp string of when the export was generated
- `schemaVersion`: integer matching the `schemaVersion` stored in the Y.Doc `meta` map
- `locale`: string locale code from the Y.Doc `user` map
- `books`: array of book objects, each containing:
  - `id`, `year`, `createdAt`, `favorite`
  - `profile`: object with `pib`, `obveznik`, `firmaRadnje`, `sediste`, `sifraPoreskogObveznika`, `sifraDelatnosti`, or `null` if not set
  - `signature`: object with `sastavioIme`, `odgovornoLiceIme`, or `null` if not set
  - `entries`: array of entry objects each with `id`, `datumPrometa`, `opisPrometa`, `odProdajeProizvoda`, `odIzvrsenihUsluga`

#### Scenario: Exported book contains all sub-entities

- **WHEN** a book has a profile, signature, and entries set
- **THEN** the exported book object SHALL include non-null `profile`, `signature`, and a non-empty `entries` array with all entry fields present

#### Scenario: Exported book with no profile or signature

- **WHEN** a book has no profile and no signature
- **THEN** the exported book object SHALL have `"profile": null` and `"signature": null`
