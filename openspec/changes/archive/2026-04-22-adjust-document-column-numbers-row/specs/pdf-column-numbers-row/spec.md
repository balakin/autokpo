## ADDED Requirements

### Requirement: Column numbers display on a separate row below headers

The PDF table header SHALL render column numbers (1, 2, 3, 4, 5) on a dedicated row positioned below the column labels, matching the official Serbian tax authority document format.

#### Scenario: Column numbers on separate row

- **WHEN** the PDF is generated
- **THEN** the table header SHALL contain a dedicated row displaying only the numbers 1, 2, 3, 4, 5 aligned with their respective data columns

#### Scenario: Header row structure

- **WHEN** the PDF is generated
- **THEN** the table header SHALL have three distinct rows:
  - Row 1: Main section headers (e.g., "ПРИХОД ОД ДЕЛАТНОСТИ" spanning columns)
  - Row 2: Individual column labels without numbers
  - Row 3: Column numbers (1, 2, 3, 4, 5)

#### Scenario: No numbers in label text

- **WHEN** the PDF header is rendered
- **THEN** column labels SHALL NOT contain embedded numbers using newline characters
- **AND** numbers SHALL appear only on the dedicated numbers row
