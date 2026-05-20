## Why

Serbian tax law requires that income received in foreign currency be recorded in RSD using the official NBS middle exchange rate on the date of the transaction. Currently, users must look up the rate manually and do the math themselves before entering amounts in the KPO entry form — a friction-heavy, error-prone step.

## What Changes

- Add a currency conversion trigger button (⇄) inside the `InputGroup.Suffix` of each amount field in the entry form
- Clicking the button while no `datumPrometa` is selected shows a toast error; otherwise opens a conversion modal
- New conversion modal allows the user to select a foreign currency (ComboBox with all NBS-listed currencies), enter an amount, see the NBS middle exchange rate and live RSD result, then apply the converted value to the entry field
- The converted RSD value is written into the amount field; the original foreign amount is not stored anywhere
- A Cloudflare Worker proxy exposes two new API endpoints that fetch currencies and exchange rates from kurs.resenje.org, shielding the frontend from CORS restrictions and preventing user IP from being sent to a third party
- React Query is added for client-side data fetching and caching of exchange rate data
- Worker-side Cloudflare Cache API caches exchange rate responses (1 year for historical dates, 1 hour for today; currencies cached 24 h)

## Capabilities

### New Capabilities

- `currency-converter`: Currency conversion modal triggered from entry form amount fields — fetches NBS exchange rates via CF Worker proxy, displays live RSD preview, applies converted value to the form field with a beta disclaimer linking to the official NBS exchange rate page

### Modified Capabilities

- `entry-management`: Entry form gains a currency conversion trigger on each amount field; submission flow unchanged (always saves RSD integers)
- `cloudflare-worker`: Two new proxy routes added under `/api/exchange-rates/`

## Impact

- **New dependency**: `@tanstack/react-query` added to `dependencies`
- **Worker**: new Hono route file `worker/routes/exchange-rates.ts`; `worker/main.ts` updated to mount it
- **Frontend**: `src/main.tsx` wrapped in `QueryClientProvider`; `src/entries/entry-form.tsx` gains ⇄ suffix button; new `src/currency/` feature directory
- **No data model changes**: `KpoEntry` schema unchanged; amounts remain RSD integers
- **No breaking changes**
