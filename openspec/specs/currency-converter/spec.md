### Requirement: Currency conversion modal opens from entry form amount fields

The system SHALL provide a currency conversion trigger button (⇄ icon, `aria-label="Konvertuj valutu"`) in the `InputGroup.Suffix` of each amount field (`Od prodaje proizvoda`, `Od izvršenih usluga`) in the entry form. When the user clicks this button and a valid `datumPrometa` is set, a conversion modal SHALL open. When no date is set, a toast error SHALL be shown instead.

#### Scenario: Trigger button shown in each amount field suffix

- **WHEN** the entry form is rendered
- **THEN** each amount field's suffix SHALL contain both the "RSD" label and the ⇄ icon button

#### Scenario: No date selected — toast error on trigger

- **WHEN** the user clicks the ⇄ button on an amount field and no `datumPrometa` is selected
- **THEN** the system SHALL display a toast error: "Nije moguće konvertovati. Najpre izaberite datum prometa." and the conversion modal SHALL NOT open

#### Scenario: Date selected — modal opens on trigger

- **WHEN** the user clicks the ⇄ button on an amount field and `datumPrometa` is set
- **THEN** the currency conversion modal SHALL open, associated with that specific amount field

---

### Requirement: Currency conversion modal fetches and displays exchange rate

The conversion modal SHALL load all NBS-listed currencies via `GET /api/exchange-rates/currencies` and display them in a filterable ComboBox. On modal open, the rate for EUR on `datumPrometa` SHALL be fetched immediately via `GET /api/exchange-rates/rate?currency=EUR&date={datumPrometa}`. When the user changes the currency selection, the rate for the new currency SHALL be fetched.

#### Scenario: Currency list loaded on modal open

- **WHEN** the conversion modal opens
- **THEN** the ComboBox SHALL be populated with all currencies returned by the API, with EUR selected by default

#### Scenario: EUR rate fetched on modal open

- **WHEN** the conversion modal opens with a valid `datumPrometa`
- **THEN** a request to `GET /api/exchange-rates/rate?currency=EUR&date={datumPrometa}` SHALL be initiated immediately

#### Scenario: Rate displayed when loaded

- **WHEN** the rate fetch completes successfully
- **THEN** the modal SHALL display "1 {CODE} = {exchange_middle} (paritet {parity}) · {date_from}" where `exchange_middle` is formatted as Serbian locale currency (e.g., "117,15 din."), `parity` is the parity factor, and `date_from` is formatted in the user's locale as a long date (e.g., "25. april 2026.")

#### Scenario: Skeleton shown while rate is loading

- **WHEN** the rate fetch is in progress
- **THEN** the rate display area SHALL show a skeleton placeholder

#### Scenario: Rate error shown on fetch failure

- **WHEN** the rate fetch fails
- **THEN** the modal SHALL display an inline error message in Serbian and the "Primeni" button SHALL be disabled

#### Scenario: Rate refetched on currency change

- **WHEN** the user selects a different currency in the ComboBox
- **THEN** a new rate request SHALL be initiated for the selected currency and `datumPrometa` date

---

### Requirement: Currency conversion modal computes and applies RSD result

The user SHALL enter a foreign currency amount in the modal. The modal SHALL compute the RSD result live as the user types using the formula `Math.round((amount × exchange_middle) / parity)` and display it. When the user confirms, the computed RSD value SHALL be written into the triggering amount field and the modal SHALL close.

#### Scenario: Live RSD preview shown while typing

- **WHEN** the rate is loaded and the user types a value in the foreign amount field
- **THEN** the modal SHALL display the computed RSD result updated on each keystroke

#### Scenario: Primeni applies converted value and closes modal

- **WHEN** the rate is loaded and the user clicks "Primeni"
- **THEN** the computed RSD integer SHALL be written into the entry form's amount field and the conversion modal SHALL close

#### Scenario: Primeni waits for in-flight rate fetch

- **WHEN** the user clicks "Primeni" while the rate fetch is still in progress
- **THEN** the submit handler SHALL await a `refetch()` call and apply the converted value once the rate resolves successfully; the modal stays open until the rate is available

#### Scenario: Otkaži closes modal without changes

- **WHEN** the user clicks "Otkaži" or dismisses the modal
- **THEN** the conversion modal SHALL close and the entry form amount field SHALL remain unchanged

---

### Requirement: Conversion modal displays beta disclaimer with NBS link

The conversion modal SHALL display a warning notice stating that exchange rates are sourced from kurs.resenje.org (a third-party service unaffiliated with NBS), that data may contain errors, and directing the user to verify rates on the official NBS website before filing.

#### Scenario: Beta disclaimer visible in modal

- **WHEN** the conversion modal is open
- **THEN** the modal SHALL display a warning notice: "Beta funkcija. Kursevi se preuzimaju sa [kurs.resenje.org]. Molimo vas da proverite zvanični kurs na sajtu [NBS] pre primene." where "kurs.resenje.org" is a HeroUI Link to `https://kurs.resenje.org` and "NBS" is a HeroUI Link to `https://webappcenter.nbs.rs/ExchangeRateWebApp/ExchangeRate/IndexPeriod?isSearchExecuted=false`, both opening in a new tab with `rel="noopener noreferrer"`
