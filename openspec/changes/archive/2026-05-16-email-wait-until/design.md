## Context

The Cloudflare Worker handles auth via better-auth. Two callbacks send email: OTP verification and account deletion confirmation. Both currently `await` the send, blocking the HTTP response. On serverless platforms this leaks timing information and is explicitly discouraged by better-auth. Cloudflare Workers provide `ExecutionContext.waitUntil(promise)` for exactly this pattern: the response is flushed immediately, and the runtime keeps the isolate alive until the promise settles.

`ExecutionContext` is available in Hono via `c.executionCtx` but is not currently threaded to the auth layer.

## Goals / Non-Goals

**Goals:**

- Both email sends use `waitUntil` instead of `await`
- HTTP response is returned before email dispatch begins
- No new dependencies introduced

**Non-Goals:**

- Error reporting / alerting on email failures (silent failures are acceptable)
- Retries on failed email sends
- Any change to email content or templates

## Decisions

### Thread `ExecutionContext` explicitly rather than using a module-level singleton

`ExecutionContext` is request-scoped. A module singleton would be unsafe under concurrent requests in the same isolate. Explicit threading (`authHandler(request, env, executionCtx)`) keeps the dependency visible and avoids shared mutable state.

_Alternative considered_: store `executionCtx` in a `AsyncLocalStorage` context. Rejected — adds complexity with no benefit for a two-call-site change.

### Keep `sendEmail` signatures unchanged; wrap at the call site

The `sendOtpEmail` and `sendAccountDeletedEmail` functions remain `async` and return `Promise<void>`. The `waitUntil` wrapper lives in `auth-options.ts` at the two call sites. This keeps the email functions reusable and independently testable without needing an `ExecutionContext`.

### Silent failure on email errors

Errors from `waitUntil`-wrapped promises are silently swallowed by the runtime. No `.catch` is added. Email is best-effort; auth flows should not fail because of a transient Resend outage.

## Risks / Trade-offs

- **Silent email failures** → Acceptable by design. Users get no code but can retry; account deletion email is purely informational.
- **`executionCtx` threading adds boilerplate** → Contained to three files and five lines total; cost is low.

## Migration Plan

Deploy is a standard worker deploy — no migrations, no feature flags. Rollback is redeploy of the previous build.
