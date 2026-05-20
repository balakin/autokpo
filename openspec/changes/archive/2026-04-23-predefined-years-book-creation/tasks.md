## 1. Constants

- [x] 1.1 Add `KPO_FIRST_YEAR = 2005` to `src/constants.ts`

## 2. Year range logic

- [x] 2.1 In `src/books/add-book-modal.tsx`, replace `YEAR_RANGE_PAST` / `YEAR_RANGE_FUTURE` constants with a year range computed from `KPO_FIRST_YEAR` to `currentYear` (descending, no future years)

## 3. Default year selection

- [x] 3.1 In `src/books/add-book-modal.tsx`, compute the default year value: `currentYear` when unoccupied, `""` when occupied; pass it as `defaultValues.year` to `useForm`

## 4. Tests

- [x] 4.1 Update `src/books/__tests__/add-book-modal.spec.tsx` to verify year range spans `KPO_FIRST_YEAR` to `currentYear` (no future years)
- [x] 4.2 Add test: current year is pre-selected when no book occupies it
- [x] 4.3 Add test: no year is pre-selected when current year is already occupied
