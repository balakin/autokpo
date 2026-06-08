## Why

The account export currently omits session data, leaving users without a complete picture of their account's active authentication sessions. Including sessions in the export gives users a full audit of their account state and aligns with data portability expectations.

## What Changes

- The exported JSON gains a `sessions` array containing all active sessions at export time
- Each session entry includes IP address, user agent, creation time, expiration time, and a flag indicating whether it is the current session
- The export `schemaVersion` is bumped from `1` to `2`

## Capabilities

### New Capabilities

_(none — sessions data is added to an existing export capability)_

### Modified Capabilities

- `account-export`: JSON structure gains a `sessions` array field; `schemaVersion` increments to `2`

## Impact

- `apps/app` — account export assembly logic (client-side) needs to fetch active sessions via the auth client and include them in the JSON blob
- No new server endpoints; sessions are fetched the same way the session management UI fetches them
