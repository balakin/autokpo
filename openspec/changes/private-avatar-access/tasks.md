## 1. Worker: Avatar storage constant

- [x] 1.1 Rename `IMMUTABLE_AVATAR_CACHE_CONTROL` to `AVATAR_CACHE_CONTROL` and change its value to `'no-store'` in `apps/app/worker/avatar-storage.ts`
- [x] 1.2 Update `storeUserUploadedAvatar` to use the renamed constant in R2 `httpMetadata.cacheControl`
- [x] 1.3 Update `importPendingAvatar` to use the renamed constant in R2 `httpMetadata.cacheControl`

## 2. Worker: Auth-gated GET endpoint

- [x] 2.1 Add `requireSession` call to `GET /avatars/:id` in `apps/app/worker/routes/avatars.ts`; return the 401 response if no session
- [x] 2.2 Query `SELECT image FROM user WHERE id = session.user.id` and return 404 if the row is missing or `user.image !== '/avatars/' + id`
- [x] 2.3 Replace `headers.set('Cache-Control', IMMUTABLE_AVATAR_CACHE_CONTROL)` with `headers.set('Cache-Control', AVATAR_CACHE_CONTROL)` (or inline `'no-store'`)
- [x] 2.4 Remove the `X-Content-Type-Options: nosniff` header if it is no longer needed, or keep it — verify intent

## 3. Client: Clear SW cache on logout

- [x] 3.1 In `logoutSession()` in `apps/app/src/auth/auth-session.ts`, add `await caches.delete('avatars')` after `authClient.signOut()` and before `writeStoredSession(null)`
- [x] 3.2 Guard the call: only invoke if `typeof caches !== 'undefined'` to avoid errors in non-SW environments (tests, old browsers)

## 4. Tests: Worker avatar route

- [x] 4.1 Update existing `GET /avatars/:id` tests in `apps/app/worker/__tests__/avatars.spec.ts` to reflect the new auth requirement
- [x] 4.2 Add test: unauthenticated GET returns 401
- [x] 4.3 Add test: authenticated GET with matching `user.image` returns 200 with `Cache-Control: no-store`
- [x] 4.4 Add test: authenticated GET with non-matching UUID returns 404
- [x] 4.5 Add test: authenticated GET for non-existent R2 object returns 404
