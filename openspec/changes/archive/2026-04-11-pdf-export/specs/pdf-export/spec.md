## ADDED Requirements

### Requirement: Export button is available in the main application view

The system SHALL render a "Preuzmi PDF" button in the main application view that triggers PDF generation and download.

#### Scenario: Button is visible

- **WHEN** the user opens the application
- **THEN** a "Preuzmi PDF" button SHALL be visible in the main application view

#### Scenario: Button is disabled without required data

- **WHEN** the entity profile has not been saved
- **THEN** the "Preuzmi PDF" button SHALL be disabled

#### Scenario: Button is enabled with required data

- **WHEN** a valid entity profile has been saved
- **THEN** the "Preuzmi PDF" button SHALL be enabled regardless of entry count

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

The system SHALL render the KPO table column headers once at the top of the document.

#### Scenario: Column headers present

- **WHEN** the PDF is generated
- **THEN** the first page SHALL contain column headers: Редни број (1), Датум и опис књижења (2), од продаје производа (3), од извршених услуга (4), СВЕГА ПРИХОДИ ОД ДЕЛАТНОСТИ (5)

#### Scenario: Grouped sub-header present

- **WHEN** the PDF is generated
- **THEN** the column header block SHALL include the "ПРИХОД ОД ДЕЛАТНОСТИ" group label spanning columns 3 and 4

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

The system SHALL always display a persistent warning informing the user that the generated PDF is a draft that must be signed and stamped by the taxpayer themselves (Члан 13, став 2 Правилника о пословним књигама). The warning is shown unconditionally because the browser opens the document in a new window, making a post-download state change invisible to the user.

#### Scenario: Warning is always visible

- **WHEN** the user opens the application
- **THEN** a warning message SHALL be visible informing the user that the document must be personally signed and stamped (Члан 13, став 2)
