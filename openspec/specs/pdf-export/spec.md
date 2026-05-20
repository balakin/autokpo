### Requirement: Export button is available in the main application view

The system SHALL render a "Preuzmi PDF" button in the working layout of the active book. The button SHALL consume the active book's profile, signature, and entries via their existing contexts (`EntityProfileContext`, `SignatureContext`, `EntriesContext`), which are now book-scoped.

#### Scenario: Button is visible in the active book's working layout

- **WHEN** the user opens a fully set-up book at `/books/<id>`
- **THEN** the "Preuzmi PDF" button SHALL be visible in the working layout

#### Scenario: Button is not rendered outside the working layout

- **WHEN** the user is on the library route (`/`) or on the setup wizard of a book
- **THEN** the "Preuzmi PDF" button SHALL NOT be rendered

#### Scenario: Generated PDF reflects the active book only

- **WHEN** the user generates a PDF while viewing book `X`
- **THEN** the PDF SHALL include `X`'s profile, signature, and entries and SHALL NOT include data from any other book

---

### Requirement: PDF download is triggered on button click

The system SHALL generate and download the KPO PDF document when the user clicks the export button.

#### Scenario: Download triggered

- **WHEN** the user clicks the "Preuzmi PDF" button
- **THEN** the browser SHALL initiate a file download of a valid PDF document

#### Scenario: Filename format

- **WHEN** the PDF is downloaded
- **THEN** the filename SHALL be `kpo.pdf`

---

### Requirement: PDF contains entity profile header on the first page

The system SHALL render the entity profile block at the top of the first page of the generated PDF, conforming to the official KPO образац.

#### Scenario: Header fields present on page 1

- **WHEN** the PDF is generated
- **THEN** page 1 SHALL contain all six entity profile fields: ПИБ, Обвезник, Фирма-радње, Седиште, Шифра пореског обвезника, Шифра делатности

---

### Requirement: PDF contains column headers on the first page

The system SHALL render the KPO table column headers once at the top of the document with a three-row structure: main section headers, sub-column labels, and column numbers on dedicated rows.

#### Scenario: Column headers present

- **WHEN** the PDF is generated
- **THEN** the first page SHALL contain the column header block with:
  - Row 1: Main headers including "Редни број", "Датум и опис књижења", "ПРИХОД ОД ДЕЛАТНОСТИ" (spanning columns), "СВЕГА ПРИХОДИ ОД ДЕЛАТНОСТИ"
  - Row 2: Sub-headers including "од продаје производа", "од извршених услуга", and "СВЕГА ПРИХОДИ ОД ДЕЛАТНОСТИ (3 + 4)"
  - Row 3: Column numbers 1, 2, 3, 4, 5 aligned with each data column

#### Scenario: Grouped sub-header present

- **WHEN** the PDF is generated
- **THEN** the column header block SHALL include the "ПРИХОД ОД ДЕЛАТНОСТИ" group label spanning columns 3 and 4 in Row 1
- **AND** Row 2 SHALL contain the sub-headers "од продаје производа" (column 3) and "од извршених услуга" (column 4)
- **AND** Row 3 SHALL display numbers 3 and 4 aligned with their respective columns

#### Scenario: Column 5 formula notation preserved

- **WHEN** the PDF header is rendered
- **THEN** column 5 Row 2 header SHALL include the "(3 + 4)" formula notation indicating the sum of columns 3 and 4
- **AND** the notation SHALL be visually associated with column 5's header text

---

### Requirement: PDF contains page numbers on every page

The system SHALL display a page number on every page of the generated PDF (Члан 4, став 2).

#### Scenario: Page number present

- **WHEN** the PDF is generated
- **THEN** every page SHALL display its page number

---

### Requirement: PDF contains all KPO entries in insertion order

The system SHALL render all stored entries as rows in the KPO table, numbered sequentially from 1.

#### Scenario: All entries rendered

- **WHEN** the PDF is generated with N entries
- **THEN** the PDF SHALL contain exactly N entry rows, numbered 1 through N in insertion order

#### Scenario: Empty state

- **WHEN** no entries have been added
- **THEN** the PDF SHALL render with an empty table body (no entry rows), but all other sections SHALL still be present

#### Scenario: СВЕГА column computed

- **WHEN** the PDF is generated
- **THEN** each entry row's column 5 SHALL equal the sum of column 3 and column 4 for that entry

---

### Requirement: PDF contains a totals row after the last entry

The system SHALL render a totals row below the last entry showing the sum of columns 3, 4, and 5 (Члан 13, став 1).

#### Scenario: Totals row present

- **WHEN** the PDF is generated
- **THEN** a totals row SHALL appear after the last entry row

#### Scenario: Totals values correct

- **WHEN** the PDF is generated with one or more entries
- **THEN** the totals row SHALL display the arithmetic sum of all values in columns 3, 4, and 5 respectively

---

### Requirement: PDF contains signature block after the totals row

The system SHALL render the signature block (Саставио / Одговорно лице) after the totals row, appearing once on the last page (Члан 13, став 2).

#### Scenario: Signature block present

- **WHEN** the PDF is generated
- **THEN** the signature block SHALL appear after the totals row containing labeled lines for Саставио and Одговорно лице

#### Scenario: Signature names pre-filled

- **WHEN** a signature has been saved in the application
- **THEN** the value of `sastavioIme` SHALL appear under the Саставио label and `odgovornoLiceIme` SHALL appear under the Одговорно лице label

#### Scenario: Signature block absent when no signature saved

- **WHEN** no signature has been saved
- **THEN** the signature line labels SHALL still render but the name fields SHALL be empty

---

### Requirement: Application always displays a legal compliance warning

The system SHALL always display a persistent warning in the working layout informing the user that the generated PDF is a draft that must be signed and stamped by the taxpayer themselves (Član 13, stav 2 Pravilnika o poslovnim knjigama). The warning is shown unconditionally in the working layout because the browser opens the document in a new window, making a post-download state change invisible to the user.

#### Scenario: Warning is always visible in working layout

- **WHEN** the user opens the working layout
- **THEN** a warning message SHALL be visible informing the user that the document must be personally signed and stamped (Član 13, stav 2)

#### Scenario: Warning displays in Latin script

- **WHEN** the user views the legal compliance warning
- **THEN** the warning text SHALL be displayed in Latin script as: "Preuzeti dokument je nacrt. Obavezno ga potpišite i overite pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama)."
