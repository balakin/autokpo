## 1. Update AccountExport type and buildAccountExport

- [x] 1.1 Add `sessions` array type to the `AccountExport` interface in `apps/app/src/settings/export.ts` — each entry: `{ ipAddress: string | null; userAgent: string | null; createdAt: string | null; expiresAt: string | null; isCurrent: boolean }`
- [x] 1.2 In `buildAccountExport`, call `fetchAccountSessions()` (from `account-settings-api.ts`) concurrently with the existing `getSession` + `listAccounts` calls via `Promise.all`
- [x] 1.3 Map the returned `AccountSession[]` to the export shape: convert `createdAt`/`expiresAt` millisecond timestamps to ISO strings (or `null`), set `isCurrent` by comparing each session's `id` against the current session id from `getSession`, and omit the `token` field
- [x] 1.4 Bump `schemaVersion` from `1` to `2` in the returned object

## 2. Update tests

- [x] 2.1 Add `mockListSessions` mock alongside existing mocks in `apps/app/src/settings/__tests__/export.spec.ts`
- [x] 2.2 Update the existing "returns correct shape for a complete account" test to supply session data and assert the new `sessions` array and `schemaVersion: 2`
- [x] 2.3 Add test: sessions with timestamps are converted to ISO strings and `isCurrent` is set correctly for the matching session
- [x] 2.4 Add test: session metadata fields that are null/missing appear as `null` in the export
- [x] 2.5 Add test: session token does not appear in any export session entry
- [x] 2.6 Add test: `listSessions` returning an unexpected shape results in an empty `sessions` array (graceful degradation)
