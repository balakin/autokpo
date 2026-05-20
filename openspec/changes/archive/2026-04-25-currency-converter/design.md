## Context

The entry form currently stores amounts only in RSD (integers). Serbian tax law requires foreign currency income to be converted at the NBS official middle exchange rate on the transaction date. Users must do this manually today.

kurs.resenje.org provides a public JSON API backed by NBS data. It cannot be called directly from the browser due to CORS, and calling it directly would leak user IPs to a third party. The Cloudflare Worker already exists as an API proxy layer.

The field `exchange_middle` from `GET /api/v1/currencies/{code}/rates/{date}` is the legally required NBS middle rate. The `parity` field indicates how many units the rate applies to (e.g., 100 for JPY); conversion formula: `rsd = Math.round((amount * exchange_middle) / parity)`.

## Goals / Non-Goals

**Goals:**

- Let users convert a foreign currency amount to RSD inside the entry form without leaving the page
- Shield kurs.resenje.org from direct browser calls (CORS + GDPR)
- Cache exchange rate data aggressively to minimize external API calls
- Make the beta status and third-party attribution explicit to the user

**Non-Goals:**

- Storing the original foreign currency amount — only RSD is saved
- Showing conversion history or audit trail
- Supporting conversion on the edit flow (already stored as RSD)
- Providing the converter outside of the entry form

## Decisions

### D1: Separate conversion modal, not inline expansion

Clicking ⇄ opens a `Modal` stacked on top of the entry modal (not an inline section that expands inside the form).

**Why**: The inline approach requires a currency `Select` and a second `CurrencyInput` to appear inside the already-dense entry form. A modal gives the converter its own focused context, avoids layout shifts, and makes the one-shot nature explicit. HeroUI supports stacked modals.

**Alternative considered**: Popover — rejected because popovers dismiss on outside click, which is hostile when the user needs to type into the foreign amount input.

### D2: Fetch rate for `datumPrometa`, not today

The rate fetched is always for the entry's `datumPrometa` date, matching the legal requirement.

**Why**: NBS middle rate must be the rate on the date of the transaction. Using today's rate would produce legally incorrect results.

**Consequence**: The ⇄ button must be enabled regardless of whether a date is selected. If no date is selected when the button is clicked, a toast error is shown instead of opening the modal.

### D3: React Query for data fetching

`@tanstack/react-query` is added as a dependency. Two queries are used inside the conversion modal:

- `['exchange-rates', 'currencies']` — fetches the currency list once per session (`staleTime: Infinity`)
- `['exchange-rates', 'rate', currency, date]` — fetches the rate for the selected currency + date (`staleTime: Infinity` for past dates, 1 h for today)

**Why**: React Query provides consistent loading/error states, deduplication, and automatic cache reuse across modal opens. The alternative (plain `useEffect` + `useState`) requires reimplementing all of this.

### D4: Cloudflare Cache API for server-side caching

The Hono route checks `caches.default` before proxying to kurs.resenje.org. Cache TTLs:

- Currencies list: 24 hours
- Historical rate (past date): 1 year (immutable — NBS never revises)
- Today's rate: 1 hour (updated once at 8 AM Europe/Belgrade)

**Why**: Historical rates never change. Caching at the edge means kurs.resenje.org is called at most once per date+currency combination across all users.

### D5: ComboBox for currency selection, EUR default

The currency selector uses HeroUI `ComboBox` (typeable, filterable). Default selected key is `"EUR"`. The rate for EUR is fetched immediately on modal open.

**Why**: ~30 NBS currencies — a plain Select would work, but ComboBox lets power users type `"USD"` or `"CHF"` directly. EUR is the overwhelming common case.

### D6: "Primeni" waits for in-flight rate fetch via `refetch()`

If the user clicks "Primeni" while the rate query is still loading, the async submit handler calls `rateQuery.refetch()` and awaits it before applying the conversion. The modal stays open during this wait. If the query errors, an inline error is shown and the modal stays open.

**Why**: The rate fetch is fast (CF edge cache on warm paths), but network conditions vary. Blocking submit gives a better experience than requiring the user to retry.

### D7: No `pnpm generate:worker-types` needed

The new routes add no new environment bindings to `wrangler.jsonc`, so `worker-configuration.d.ts` does not need to be regenerated.

## Risks / Trade-offs

- **kurs.resenje.org availability** → If the service is down, the modal shows an error and the user must enter RSD manually. Acceptable — the field always accepts direct RSD input.
- **Rate accuracy disclaimer** → kurs.resenje.org is not NBS itself; data could have sync lag or errors. Mitigated by the beta disclaimer with a direct link to the official NBS exchange rate page.
- **parity edge case** → Most currencies have parity=1, but some (e.g., JPY at 100) do not. The conversion formula accounts for this; must be tested.
- **Today's rate timing** → NBS publishes the rate at 8 AM Europe/Belgrade. Between midnight and 8 AM, kurs.resenje.org will return the previous day's rate for "today". The `date_from` field in the response shows which rate was actually applied; this is shown to the user.
- **React Compiler compatibility** → React Query hooks must not be wrapped in `useMemo`/`useCallback` (React Compiler handles memoization). This is already the project convention.
