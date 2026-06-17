# product-copy-consistency Specification

## Purpose

Define consistent product positioning and localized copy constraints across the public website, app metadata, and app-visible explanatory text.

## Requirements

### Requirement: Unified product positioning terms

External product copy SHALL describe AutoKPO as KPO record-keeping for flat-rate entrepreneurs in Serbia. Serbian Latin copy SHALL use equivalent terminology based on "preduzetnik paušalac u Srbiji". Russian copy SHALL use equivalent terminology based on "предприниматель на паушальном налогообложении в Сербии" or a shorter layout-safe variant where appropriate.

#### Scenario: External English copy uses unified positioning

- **WHEN** a visitor or crawler reads website, social, install, or app-help product positioning copy in English
- **THEN** the copy SHALL communicate KPO record-keeping for flat-rate entrepreneurs in Serbia
- **AND** it SHALL avoid the primary phrase "Book of Achieved Turnover" except as an optional parenthetical explanation of KPO

#### Scenario: Localized copy uses equivalent positioning

- **WHEN** a visitor or crawler reads Serbian Latin or Russian product positioning copy
- **THEN** the copy SHALL use the localized equivalent of flat-rate entrepreneur in Serbia
- **AND** the Russian copy SHALL avoid awkward literal translations of "Knjiga o ostvarenom prometu" as the primary product phrase

### Requirement: Compact app labels remain layout-safe

The system SHALL preserve compact, task-oriented labels in navigation, buttons, tabs, form fields, and card headings unless the label itself is part of product positioning. Official/form labels SHALL remain precise for regulated data.

#### Scenario: Official labels remain precise

- **WHEN** the app displays labels for taxpayer profile data, TIN, taxpayer code, activity code, or related official fields
- **THEN** the labels SHALL remain based on taxpayer/obveznik terminology rather than the longer flat-rate entrepreneur positioning phrase

#### Scenario: Compact controls avoid long product phrasing

- **WHEN** the app displays compact controls such as navigation links, tabs, buttons, or icon labels
- **THEN** the labels SHALL avoid the full phrase "flat-rate entrepreneur in Serbia" and use short task labels such as Books, Entries, Profile, or Settings where applicable
