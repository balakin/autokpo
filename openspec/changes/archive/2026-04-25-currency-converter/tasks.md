## 1. Dependencies and project setup

- [x] 1.1 Add `@tanstack/react-query` to `dependencies` in `package.json` and install
- [x] 1.2 Wrap the app root in `QueryClientProvider` in `src/main.tsx`

## 2. Cloudflare Worker — exchange rates proxy

- [x] 2.1 Create `worker/routes/exchange-rates.ts` with Hono router; implement `GET /api/exchange-rates/currencies` proxying `kurs.resenje.org/api/v1/currencies`, returning `{ currencies }`, with 24-hour Cloudflare Cache API caching
- [x] 2.2 Implement `GET /api/exchange-rates/rate` in the same file: validate `currency` and `date` query params (400 on missing), proxy `kurs.resenje.org/api/v1/currencies/{currency}/rates/{date}`, return `{ exchange_middle, parity, date, date_from }`, cache 1 year for past dates and 1 hour for today (compare against Europe/Belgrade date)
- [x] 2.3 Mount the exchange-rates router in `worker/main.ts`
- [x] 2.4 Write worker tests in `worker/exchange-rates.spec.ts` covering: currencies endpoint returns 200 with list; rate endpoint returns 200 with correct fields; missing params return 400; unknown currency returns 404

## 3. Frontend — API client and React Query hooks

- [x] 3.1 Create `src/currency/exchange-rates-api.ts` with two typed fetch functions: `fetchCurrencies(): Promise<Currency[]>` and `fetchRate(currency, date): Promise<ExchangeRate>` — both call `/api/exchange-rates/*`
- [x] 3.2 Create `src/currency/use-exchange-rates.ts` exporting `useCurrencies()` (`staleTime: Infinity`) and `useExchangeRate(currency, date)` (`staleTime: Infinity` for past dates, 1 hour for today)

## 4. Currency conversion modal

- [x] 4.1 Create `src/currency/currency-convert-modal.tsx` — modal component accepting `{ isOpen, onClose, onApply, datumPrometa, fieldLabel }` props
- [x] 4.2 Implement ComboBox for currency selection using `useCurrencies()`: items from API, `defaultSelectedKey="EUR"`, full-width, filterable; show skeleton while currencies load
- [x] 4.3 Add foreign amount input using `CurrencyInput` (same config as existing amount fields)
- [x] 4.4 Fetch rate with `useExchangeRate(selectedCurrency, datumPrometa)` on modal open (EUR by default); show `Skeleton` while loading; show inline error on fetch failure
- [x] 4.5 Display rate line: `1 {CODE} = {exchange_middle} (paritet {parity}) · {date_from}` — `exchange_middle` formatted as Serbian locale currency via `Intl.NumberFormat`; `date_from` formatted long via `Intl.DateTimeFormat`
- [x] 4.6 Compute and display live RSD preview: `Math.round((amount × exchange_middle) / parity)` — update on every amount keystroke; blank when amount is empty or rate not ready
- [x] 4.7 Implement "Primeni" button: if rate ready, call `onApply(rsdResult)` and close; if rate still loading, `await rateQuery.refetch()` in the async submit handler and apply once resolved; if rate errored, keep modal open (`isDisabled` on button)
- [x] 4.8 Implement "Otkaži" button: close modal without changes
- [x] 4.9 Add beta disclaimer section with HeroUI `Alert`; includes two `Link`s: kurs.resenje.org and NBS exchange rate page, both `target="_blank"`, `rel="noopener noreferrer"`

## 5. Entry form integration

- [x] 5.1 Add `showCurrencyConverter` boolean prop to `EntryForm` (default `false`); pass `true` from the add entry modal, `false` from the edit modal
- [x] 5.2 Add ⇄ icon button (`LuArrowLeftRight`, `isIconOnly`, `size="sm"`, `variant="ghost"`, `aria-label="Konvertuj valutu"`) in `InputGroup.Suffix` of each amount field — rendered only when `showCurrencyConverter` is `true`
- [x] 5.3 On ⇄ button press: if no `datumPrometa` value, show toast error "Nije moguće konvertovati. Najpre izaberite datum prometa."; otherwise open `CurrencyConvertModal` associated with that field
- [x] 5.4 Wire `onApply` from the modal to `field.onChange` for the corresponding amount field, formatted as a decimal string compatible with `CurrencyInput`

## 6. i18n

- [x] 6.1 Run `pnpm i18n:extract` to generate new message keys
- [x] 6.2 Fill in `en` translations for all new strings (toast error, modal heading, button labels, rate display, disclaimer)
- [x] 6.3 Fill in `ru` translations for all new strings

## 7. Tests

- [x] 7.1 Write `src/currency/__tests__/currency-convert-modal.spec.tsx` covering: modal opens with EUR selected; rate skeleton shown while loading; rate and preview displayed when loaded; Primeni applies value and closes; Otkaži closes without changes; Primeni waits and applies when rate resolves during pending state; error shown on rate fetch failure
- [x] 7.2 Write tests for `src/currency/exchange-rates-api.ts` (unit tests for fetch functions with mocked fetch)
- [x] 7.3 Update `src/entries/__tests__/entry-form.spec.tsx`: add test that ⇄ button appears when `showCurrencyConverter=true`; add test for toast shown when no date selected

## 8. Final checks

- [x] 8.1 Run `pnpm lint:fix` and resolve any remaining lint errors
- [x] 8.2 Run `pnpm build` and confirm no type errors
- [x] 8.3 Run `pnpm test` (full suite) and confirm all pass
