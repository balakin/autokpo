## ADDED Requirements

### Requirement: Setup layout renders two form cards in order

The setup layout SHALL render two cards stacked vertically: first the entity profile form card, then the signature form card. Each card SHALL have an external submit button in its footer.

#### Scenario: Entity profile form card is first

- **WHEN** the setup layout is active
- **THEN** the entity profile form card SHALL appear before the signature form card

#### Scenario: Each card has a save button in the footer

- **WHEN** the setup layout is active
- **THEN** each card footer SHALL contain a "Sačuvaj" button that submits its respective form
