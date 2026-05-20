## Context

The current app boots a module-global `ydoc`, `IndexeddbPersistence`, and sync engine before any user identity is known. That shape worked while the app behaved like a single local profile per origin, but it now blocks several goals at once: a lightweight signed-out entry experience, user-scoped persistence, cross-tab logout, and reuse of leader election outside CRDT. The repo also already has clear separation between collaborative document state and device-scoped settings such as theme, which makes auth-first runtime ownership a natural next step.

The change is cross-cutting. It touches app bootstrap, provider composition, sync authority, persistence naming, and cross-tab orchestration. It also needs to stay compatible with a staged rollout: mock auth first, backend `HttpOnly` cookie sessions later.

## Goals / Non-Goals

**Goals:**

- Gate the signed-in app behind auth state so signed-out tabs do not mount CRDT or sync runtime.
- Make Yjs runtime ownership follow the signed-in React lifecycle rather than module scope.
- Extract leader election into an app-level feature that can be shared by auth, sync, and cleanup.
- Scope persistent user data to user-specific IndexedDB and `localStorage` keys.
- Support origin-wide logout by having a leader publish auth state and a signed-out cleaner eventually remove all app-owned user data.
- Preserve theme as a device preference across sign-in and sign-out.
- Keep the client architecture stable when mock auth is replaced by backend session endpoints.

**Non-Goals:**

- Implement real backend auth in this change.
- Guarantee mathematically perfect cross-tab teardown before any persisted cleanup occurs.
- Support multiple simultaneously active accounts on one device.
- Redesign sync semantics beyond changing where leader authority and runtime ownership live.

## Decisions

### 1. Introduce `LeaderProvider` as an app-level capability

Leadership is no longer only a CRDT concern. The same leader now needs to own session fetch/revalidate, sign-in/logout side effects, sync traffic, and signed-out cleanup. Keeping leader election inside `src/crdt/leader.ts` would make auth and cleanup depend conceptually on CRDT, which is backwards once auth becomes the top-level gate.

The new shape is:

```text
App
└── LeaderProvider
    └── AuthProvider
        └── SessionGate
```

`LeaderProvider` exposes:

- `isLeader`: reactive render-time value for mounting leader-only UI/effects
- `getIsLeader()`: imperative freshness check for timers, async callbacks, and event handlers

Alternative considered: keep the existing CRDT-owned leader module and let auth/cleanup import it directly. Rejected because it hard-codes a lower-layer ownership model and makes signed-out behavior depend on CRDT internals.

### 2. Auth is the first runtime gate

`AuthProvider` becomes the control plane above CRDT. It resolves session state into `loading`, `signed_out`, or `signed_in`, exposes `userId`, and provides `signIn()` / `logout()` actions. `SessionGate` decides whether the signed-in subtree exists at all.

This explicitly separates:

- auth state: whether a session exists
- CRDT hydration: whether the signed-in runtime is ready
- sync freshness: whether server sync is up to date

Alternative considered: keep app boot global and only hide signed-in routes when signed out. Rejected because it still pays CRDT/sync bundle and lifecycle cost before auth and does not solve the global-doc teardown problem.

### 3. Move CRDT runtime into the signed-in subtree

The signed-in subtree will own creation and destruction of:

- `Y.Doc`
- `IndexeddbPersistence`
- doc bootstrap
- sync engine listeners/effects

This replaces the module-global singleton with a runtime resource tied to React mount/unmount. Signed-out state therefore means there is no active signed-in CRDT runtime in memory.

Alternative considered: reuse one global doc and reset it on logout. Rejected because the global singleton still exists before auth, teardown remains implicit, and auth/session changes keep racing with runtime-global listeners.

### 4. Use user-scoped persistence keys

User data persistence will use user-derived names, for example:

- IndexedDB: `autokpo-yjs:<userId>`
- sync metadata: `autokpo:sync:<userId>`

Theme remains global per device: `autokpo:theme`.

This is a pragmatic isolation boundary. Even if a stale tab lingers briefly, any leftover writes stay isolated to the old user's storage scope instead of contaminating a later session.

Alternative considered: keep one global DB/key and rely on perfect logout cleanup. Rejected because browser tabs do not provide strong enough cross-tab teardown guarantees to make that safe or simple.

### 5. Make the leader the only tab that performs shared side effects

Only the leader performs:

- session fetch and revalidate
- sign-in/logout backend requests
- sync pull/push/compact traffic
- signed-out persistence cleanup

Followers request those actions from the leader over an auth coordination channel and mirror leader-published auth state. Each tab still owns its own in-memory runtime teardown when auth leaves `signed_in`.

Alternative considered: separate auth and sync leaders. Rejected because logout sequencing becomes harder if the tab making auth decisions is not the same tab controlling sync side effects.

### 6. Keep auth status simple and move hard cleanup into a signed-out cleaner

Public auth state remains only:

- `loading`
- `signed_out`
- `signed_in`

On logout, the leader publishes `signed_out` quickly so healthy tabs unmount the signed-in subtree and stop CRDT/storage activity. Persisted data cleanup then happens through a leader-only cleaner mounted in `signed_out`, which sweeps immediately on mount and periodically afterwards.

This treats cleanup as eventual hygiene, not as a fragile synchronous obligation of the logout button path.

Alternative considered: add a separate public `cleanup` auth state and block final signed-out status on cleanup completion. Rejected for now because user-scoped storage plus leader-only sweeps provide enough safety with lower complexity.

### 7. Stage auth implementation behind a stable provider contract

The first implementation uses a delayed mock session source backed by `localStorage`. The provider contract remains the same when real backend auth is added later:

- mock now: promise-based local session marker
- real later: `GET /api/session`, `POST /api/logout`, `HttpOnly` cookie

This keeps the app architecture stable while only swapping the internals of session resolution and auth actions.

## Risks / Trade-offs

- **Leader transition lag** → Follower tabs depend on the leader to perform shared auth/sync side effects. Mitigation: keep follower protocol simple, request current auth state on boot, and let the next tab reacquire leadership if the leader closes.
- **Eventual rather than immediate persistence cleanup** → Signed-out cleanup may not happen at the exact instant logout is requested. Mitigation: unmount signed-in runtime first, isolate stores by user scope, and run the cleaner immediately plus periodically while signed out.
- **Provider stack and bootstrap complexity increase** → App bootstrap becomes more layered. Mitigation: give each provider one clear responsibility: leader, auth, signed-in runtime.
- **Migration from global imports to runtime-owned resources touches many files** → Existing sync/doc modules assume singleton imports. Mitigation: refactor around provider-owned runtime surfaces and update tests alongside the runtime boundary.
- **Mock auth can leak into permanent architecture if not constrained** → Development shortcuts can become sticky. Mitigation: define auth around a provider contract that already matches the later backend session model.

## Migration Plan

1. Extract leader election into a standalone app-level provider and hook/service surface.
2. Introduce `AuthProvider` and a signed-out entry path with mock async session resolution.
3. Move CRDT runtime creation out of module scope into a signed-in runtime/provider subtree.
4. Convert sync engine and related utilities to consume leader/runtime context instead of global CRDT singletons.
5. Change persistence naming to user-scoped IndexedDB and sync metadata keys while preserving theme.
6. Add leader-only signed-out cleaner that removes all app-owned user data and repeats periodically.
7. After the client runtime is stable, replace mock auth internals with backend session endpoints and cookies in a follow-up change.

Rollback strategy: revert the provider split and restore the old global runtime only if the new boot/auth boundary proves unstable during implementation. Because this is a client-only staged change at first, rollback is mostly a code reversion rather than a data migration.

## Open Questions

- What exact auth bus message shapes should be standardized for follower-to-leader requests and leader-to-followers state publication?
- Should the signed-in chunk mount only after CRDT hydration completes, or should it render a signed-in loading shell while the runtime hydrates?
- How should app-owned IndexedDB names be enumerated for deletion in browsers with limited IndexedDB introspection support?
- Should the signed-out cleaner also run while `signed_in` to prune non-active-user residue, or remain strictly a signed-out concern?
