## Why

The app now stores state directly in a single Yjs document, but several feature providers still materialize broad snapshots and expose context wrappers that were designed around the old state model. This keeps reads wider than necessary, makes rerender behavior harder to reason about, and leaves agent guidance and tests anchored to an outdated architecture.

## What Changes

- Replace Yjs-backed feature providers with selector-based reads and mutation namespaces organized by entity.
- Add a small `useBookId()` route hook as the router boundary for book-scoped screens.
- Make `useYDoc` default to `shallowEqual`, and require selectors to return shallow-friendly projections.
- Update app-specific agent guidance in `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` to document selector-first reads, mutation namespaces, and the new testing policy.
- Migrate one provider path as the canonical Stage 1 reference implementation, then roll the established pattern out to the remaining providers in Stage 2.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crdt-store`: define `useYDoc` shallow-equality defaults and selector-friendly read patterns for the Yjs document.
- `ai-agent-guidance`: update app-specific guidance so agents follow selector/mutation architecture and the new testing rules.
- `entity-profile`: replace `EntityProfileContext`/provider-based access with selector and mutation modules while preserving observable profile behavior.
- `signature`: replace `SignatureContext`/provider-based access with selector and mutation modules while preserving observable signature behavior.
- `entry-management`: replace `EntriesContext`/provider-based access with selector and mutation modules while preserving observable entry behavior.

## Impact

- Affected code: `apps/app/src/crdt/`, `src/books/`, `src/entity-profiles/`, `src/signatures/`, `src/entries/`, and routed consumers that currently depend on provider hooks.
- Affected guidance: `apps/app/CLAUDE.md` and `apps/app/AGENTS.md` only; root guidance remains unchanged.
- Affected tests: provider-oriented tests will shift toward selector and mutation unit tests plus UI integration tests seeded with real Yjs state.
