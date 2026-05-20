## MODIFIED Requirements

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
