## 1. Refactor BookLibrary layout

- [x] 1.1 Remove the centered container (`items-center`, `max-w-3xl`) from `BookLibrary` and replace with the standard full-width flex column (`flex flex-col gap-6 p-4 lg:p-6`)
- [x] 1.2 Replace the `text-2xl` heading with the Icon + Label pattern: `LuBook` icon (`size-5 text-muted aria-hidden`) + `<h1 className="text-xl font-semibold">Knjige</h1>`
- [x] 1.3 Move the "Nova knjiga" `AddBookModal` button to the AppShell TopBar via `TopBarActionsSlot`
- [x] 1.4 Adjust the book list wrapper gap from `gap-3` to `gap-4` for consistency

## 2. Tests

- [x] 2.1 Update or add a Vitest + RTL test in `src/books/__tests__/` verifying the `LuBook` icon and "Knjige" heading are rendered
- [x] 2.2 Run `pnpm -s test --reporter=json --changed` and confirm all tests pass

## 3. Lint & type-check

- [x] 3.1 Run `pnpm -s lint:fix` and resolve any remaining lint errors
- [x] 3.2 Run `pnpm -s build 2>&1 | grep -E 'error TS|error:'` and confirm no type errors
