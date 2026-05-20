## Why

Email sending in auth callbacks is currently `await`ed, which blocks the HTTP response and leaks timing information — a known attack vector that better-auth explicitly warns against. On Cloudflare Workers (a serverless platform), the correct pattern is `executionCtx.waitUntil(promise)`: the response is returned immediately while the runtime keeps the worker alive until the promise settles.

## What Changes

- `authHandler` accepts an `ExecutionContext` parameter alongside `Request` and `Env`
- `getAuth` receives and threads `ExecutionContext` into auth options
- `getAuthOptions` accepts `executionCtx: ExecutionContext` and uses `executionCtx.waitUntil()` instead of `await` for both email sends
- Tests updated to supply a mock `ExecutionContext`

## Capabilities

### New Capabilities

- `email-wait-until`: Non-blocking email dispatch in auth callbacks via `executionCtx.waitUntil`

### Modified Capabilities

<!-- No spec-level behavior changes — email still sends on the same events. Only the delivery mechanism (blocking → non-blocking) changes. -->

## Impact

- `apps/app/worker/main.ts` — pass `c.executionCtx` to `authHandler`
- `apps/app/worker/auth.ts` — update `authHandler` and `getAuth` signatures
- `apps/app/worker/auth-options.ts` — add `executionCtx` to `AuthOptionsInput`; replace `await` with `waitUntil`
- `apps/app/worker/__tests__/email-otp-auth.spec.ts` — pass mock `executionCtx`
- No API surface changes, no new dependencies
