## ADDED Requirements

### Requirement: Exchange rates currencies proxy endpoint

The system SHALL expose `GET /api/exchange-rates/currencies` that proxies `https://kurs.resenje.org/api/v1/currencies` and returns the list of NBS-listed currencies. The response SHALL be cached at the Cloudflare edge for 24 hours.

#### Scenario: Returns currency list

- **WHEN** a request is made to `GET /api/exchange-rates/currencies`
- **THEN** the worker responds with status 200 and JSON body `{ currencies: [{ code, country }] }` sourced from kurs.resenje.org

#### Scenario: Upstream error propagated

- **WHEN** kurs.resenje.org returns a non-200 response for the currencies request
- **THEN** the worker SHALL respond with the same HTTP status code and a JSON error body

#### Scenario: Response cached at edge for 24 hours

- **WHEN** `GET /api/exchange-rates/currencies` is requested more than once within 24 hours
- **THEN** subsequent requests within the cache window SHALL be served from the Cloudflare edge cache without calling kurs.resenje.org

---

### Requirement: Exchange rate proxy endpoint

The system SHALL expose `GET /api/exchange-rates/rate?currency={CODE}&date={YYYY-MM-DD}` that proxies `https://kurs.resenje.org/api/v1/currencies/{CODE}/rates/{YYYY-MM-DD}` and returns the NBS exchange rate for the given currency on the given date. The response SHALL include `exchange_middle`, `parity`, `date`, and `date_from`. Historical rates (dates before today in Europe/Belgrade) SHALL be cached at the Cloudflare edge for 1 year. Today's rate SHALL be cached for 1 hour.

#### Scenario: Returns rate for a past date

- **WHEN** a request is made to `GET /api/exchange-rates/rate?currency=EUR&date=2026-01-15`
- **THEN** the worker responds with status 200 and JSON body containing `{ exchange_middle, parity, date, date_from }`

#### Scenario: Returns rate for today

- **WHEN** a request is made to `GET /api/exchange-rates/rate?currency=EUR&date={today}`
- **THEN** the worker responds with status 200 and JSON body containing `{ exchange_middle, parity, date, date_from }`

#### Scenario: Missing query parameters return 400

- **WHEN** a request is made to `GET /api/exchange-rates/rate` with `currency` or `date` missing
- **THEN** the worker SHALL respond with status 400 and a JSON error body

#### Scenario: Unknown currency returns 404

- **WHEN** a request is made with an unrecognised currency code
- **THEN** the worker SHALL respond with status 404

#### Scenario: Historical rate cached for 1 year

- **WHEN** `GET /api/exchange-rates/rate?currency=EUR&date=2026-01-15` is requested more than once
- **THEN** subsequent requests SHALL be served from the Cloudflare edge cache without calling kurs.resenje.org

#### Scenario: Today's rate cached for 1 hour

- **WHEN** `GET /api/exchange-rates/rate?currency=EUR&date={today}` is requested within the same hour
- **THEN** subsequent requests within the 1-hour window SHALL be served from the Cloudflare edge cache
