Guidance for AI coding agents working in `apps/app/` (`@autokpo/app`).

> Root guidance (monorepo layout, turbo commands, token-efficiency principles) is in the repository root `AGENTS.md`.

## What this project is

AutoKPO is a local-first web app for generating the Serbian tax "Knjiga o ostvarenom prometu" (KPO — Book of Achieved Turnover). Application state (books, entries, profiles, signatures, locale) lives in a single Yjs `Y.Doc` persisted to IndexedDB via `y-indexeddb`, with cross-device sync through a Cloudflare Worker backed by D1. Theme remains in `localStorage` as a per-device preference. The `src/crdt/` module manages the document, sync state, leader election, cross-tab fan-out, and the React Query–driven sync engine.

## Commands

Run via `cd apps/app && pnpm -s <script>`. For linting use `pnpm -s eslint` / `pnpm -s prettier` directly per root guidance.

```bash
build                  # tsc -b + vite build
test                   # vitest run
i18n:extract           # extract messages from source into .po files
generate:worker-types  # regenerate wrangler types
check:worker-types     # verify types match (CI/pre-commit)
db:generate            # generate a new D1 migration after schema changes
db:migrate:local       # apply migrations to local D1 (dev/test)
db:migrate:remote      # apply migrations to remote D1 (before worker deploy)
```

**Wrangler**: run `generate:worker-types` after any change to `wrangler.jsonc`. The pre-commit hook and CI/CD run `check:worker-types` to verify types are up to date.

**D1 migrations**: after changing `worker/db/schema.ts`, run `db:generate` to create a migration, then `db:migrate:local` to apply it locally. Production migrations are applied automatically by the deploy workflow (`db:migrate:prod`, `--env production`) before the worker deploy step.

Deploys auto-apply migrations to production, so every migration must follow the **expand/contract** rule — it must be tolerated by the currently-live (old) worker. Never emit a single-shot `RENAME COLUMN` / `DROP COLUMN`; split renames and drops across releases. See [`docs/migrations.md`](docs/migrations.md) for the safe/unsafe table and step-by-step recipes.

## Architecture

Feature specs, architecture decisions, and design rationale live in `openspec/`. Read `openspec/specs/` for current requirements and `openspec/changes/archive/` for historical context.

### Module layout

- `src/crdt/` — Y.Doc factory (`doc.ts`), selector hook (`use-y-doc.ts`), sync state side-channel (`sync-state.ts`), wire-format client (`sync-client.ts`), sync engine hook (`use-sync-engine.ts`), pure sync logic (`sync-logic.ts`), leader election (`leader.ts`), BroadcastChannel bus (`bus.ts`), provider (`crdt-provider.tsx`)
- `worker/db/` — Drizzle schema + migrations for the `updates` table
- `worker/routes/sync.ts` — Hono sub-app for `GET/POST /api/sync` and `POST /api/sync/compact`

## Key conventions

- **Imports**: always `import type` for type-only imports. Import groups separated by a blank line, external before internal.
- **Import aliases**: `src/` and `tests/` aliases are available in test files only (configured in `tsconfig.tests.json` and `vite.config.ts`). App source files must use relative imports.
- **Tailwind**: v4 (no `tailwind.config.js`; configured via `@tailwindcss/vite`).
- **Styling**: use `tailwind-variants` (`tv`) for component variants. Use `slots` API for multi-part components, `slot({ class: className })` for composition. Split long class strings with `+` concatenation for readability.
- **React Compiler**: enabled — do not hand-write `useMemo` / `useCallback`.
- **Tests**: every feature ships with a Vitest + React Testing Library test using `renderWithProviders` from `tests/render-helpers.tsx`. For Yjs-backed domains, test selectors and mutations with direct unit tests, and keep UI integration tests wired to real Yjs-seeded state; do not mock selector or mutation modules in UI tests.
- **Module structure**: every concern lives in its own folder under `src/`. Files inside a module are flat — no nested subfolders within a module. Two exceptions: `__tests__/` (co-located tests for that module) and an optional `index.ts` public entrypoint barrel. The `src/` root is reserved for `index.css`, `main.tsx`, `constants.ts`, and `vite-env.d.ts`. Never create `src/__tests__/` — any file that needs tests must live in a named module folder.
- **Worker module structure**: same flat-file, co-located-tests convention as `src/`, applied to `worker/`. Modules: `app/` (Hono app assembly), `auth/` (auth, OTP, email senders, disposable-email list), `i18n/` (i18n setup), `middlewares/` (Hono middleware — plural), `routes/` (Hono sub-apps). Each module keeps its tests in its own `__tests__/` subfolder — never create `worker/__tests__/`. The `worker/` root is reserved for exactly: `main.ts`, `env.d.ts`, `context.ts`, `constants.ts`. `worker/db/` is the one structural exception (Drizzle requires nested `schema/` and `migrations/` subfolders). `worker/locales/` is a sibling to `worker/i18n/` mirroring `src/locales/`.
- **HeroUI v3 beta**: compound component API (`Card.Header`, `Card.Content`, …). v2 patterns are incompatible and training data is stale. Before writing or modifying any HeroUI component you **MUST**:
  1. `mcp__heroui-react__list_components` — confirm it exists in v3.
  2. `mcp__heroui-react__get_component_docs` — API, props, usage.
  3. `mcp__heroui-react__get_component_source_code` / `_styles` — only if docs are insufficient.

  Never write HeroUI code from memory; never use web search or Context7 for HeroUI.

- **Other library docs**: before writing non-trivial code against any third-party library or CLI in this stack (React, Vite, Vitest, RTL, Tailwind v4, Zod, …), you **MUST** consult Context7 (`mcp__context7__resolve-library-id` → `query-docs`). Skip only for pure refactors or general programming that doesn't touch a library API.
- **i18n**: Source locale is `sr-Latn`. All UI strings must be wrapped in `<Trans>` / `t()` / `msg`. Catalogs are `.po` files compiled on-the-fly by the Vite plugin — no manual compile step needed. When adding new translatable strings: (1) run `i18n:extract` to update `.po` files, (2) fill in translations for every locale (`en`, `ru`). The pre-commit hook runs extract automatically and stages the updated `.po` files, but you must fill translations before the commit can succeed.

  **Trans vs t in TSX**: inside `.tsx` files, always prefer `<Trans>...</Trans>` for JSX content. Use `` t`string` `` (or `t()`) only for string-only contexts where JSX is not accepted:

  ```jsx
  // ✅ JSX content — use <Trans>
  <Button><Trans>Sačuvaj</Trans></Button>
  <Modal.Heading><Trans>Nova knjiga</Trans></Modal.Heading>
  <p><Trans>Izaberite godinu za novu knjigu.</Trans></p>
  <dt><Trans>PIB</Trans></dt>
  {condition ? <Trans>Uredi unos</Trans> : <Trans>Novi unos</Trans>}

  // ✅ String props, callbacks, non-JSX — use t
  <Button aria-label={t`Dodaj unos`} />
  <Input placeholder={t`Izaberite godinu`} />
  <Label>{t`Godina`}</Label>          {/* HeroUI Label expects string */}
  <Table.Content aria-label={t`KPO unosi`} />
  z.string().min(1, t`Polje je obavezno`)   // Zod validation
  toast.success(t`Profil je sačuvan`)       // toast calls
  const items = [{ label: t`Knjige`, href: '/books' }]  // JS data
  <ListBox.Item id="light" textValue={t`Svetla`} />     // textValue prop
  <Calendar aria-label={t`Datum prometa`} />            // aria-label
  ```

  When a component no longer needs `t` after switching to `<Trans>`, remove the `useLingui` import and unused `const { t } = useLingui()`.

  **Pluralization**: never nest `<Plural>` inside `<Trans>`. Pluralization must be the top-level translation unit so translators control the full sentence and can restructure grammar per locale. Put the entire sentence — including surrounding words — inside the `<Plural>` forms instead:

  ```jsx
  // ❌ Wrong — Plural nested inside Trans
  <Trans>You have <Plural value={count} one="# message" other="# messages" />.</Trans>

  // ✅ Correct — Plural is the top-level unit
  <Plural value={count} one="You have # message." other="You have # messages." />

  // ✅ Exception — Plural inside Trans is acceptable when it must appear inside markup that cannot move,
  // but add an ESLint disable comment to document the intentional exception:
  // eslint-disable-next-line lingui/no-plural-inside-trans
  <Trans>You have <strong><Plural value={count} one="# message" other="# messages" /></strong>.</Trans>
  ```

- **CRDT / Yjs**: All app state lives in a single `Y.Doc`. **Reading state in React**: always use `useYDoc(selector, isEqual?)` from `src/crdt/use-y-doc.ts` — never subscribe to Yjs events directly in components. `useYDoc` defaults to `shallowEqual`; selectors should return shallow-friendly projections (primitives, flat objects, or minimal arrays of primitives/flat items) and avoid broad nested snapshots. **Routing boundary**: book-scoped UI should derive route params through `useBookId()` and pass that id into selector factories. **Writing state**: mutate through entity-scoped mutation namespaces (for example `profileMutations`, `signatureMutations`, `entryMutations`, `bookMutations`) that wrap writes in `ydoc.transact(() => { … })`; avoid reintroducing feature-level provider wrappers for Yjs-backed state. **Remote updates**: always apply with `Y.applyUpdate(doc, bytes, REMOTE_ORIGIN)` where `REMOTE_ORIGIN` is the module-private `Symbol('autokpo:remote')` exported from `src/crdt/sync-logic.ts` — it prevents echo loops. **Filtering local edits**: the doc's `update` event listener checks `origin !== REMOTE_ORIGIN` to distinguish local vs remote edits. **Subscription granularity**: `useYDoc` subscribes to `afterTransaction` (batched), not per-edit `update` events. **Sync metadata** is a `localStorage` side-channel under `autokpo:sync` — never written into the Y.Doc (that would cause recursive bloat). **Leader tab**: only the Web Locks leader makes HTTP requests to `/api/sync*`; followers communicate via `BroadcastChannel`.
- **Icons**: Lucide via `react-icons/lu` only (e.g. `import { LuPencil } from 'react-icons/lu'`). No `react-icons/fa6`, no `@iconify/react`, no ad-hoc SVGs. Browse available icons at <https://react-icons.github.io/react-icons/icons/lu/>.
