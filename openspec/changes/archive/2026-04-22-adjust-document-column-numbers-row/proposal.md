## Why

The current PDF document output for the KPO (Knjiga prihoda i rashoda) report does not match the official Serbian tax authority format. The PDF example shows that column numbers (1, 2, 3, 4, 5) must appear on a separate row below the column headers, but the current implementation displays them differently. This change ensures the generated document complies with the official format requirements.

## What Changes

- Adjust the table header structure in the PDF document to display column numbers (1, 2, 3, 4, 5) on a separate row below the column titles
- Modify the header layout to match the official "KNJIGA O OSTVARENOM PROMETU PAUŠALNO OPOREZOVANIH OBVEZNIKA" format:
  - Row 1: Main section headers (e.g., "PRIHOD OD DELATNOSTI" spanning multiple columns)
  - Row 2: Sub-column headers (e.g., "od prodaje proizvoda", "od izvršenih usluga", "SVEGA PRIHODI OD DELATNOSTI (3 + 4)")
  - Row 3: Column numbers (1, 2, 3, 4, 5) aligned with each data column
- **Preserve the "(3 + 4)" notation** in the column 5 header label as required by the official format
- Ensure proper spacing and alignment between header rows
- Maintain existing data row formatting

## Capabilities

### New Capabilities

- `pdf-column-numbers-row`: Support for displaying column numbers on a dedicated row in PDF table headers, matching the official Serbian tax document format

### Modified Capabilities

- `pdf-document-generation`: Update PDF table header rendering to use multi-row headers with column numbers on a separate row

## Impact

- PDF document generation component(s)
- Table header styling and layout
- Print/export functionality for KPO reports
