---
'@autokpo/app': minor
---

Replaced Better Auth's built-in rate limiter on auth endpoints with a Cloudflare Workers rate limiter keyed by IP and path.
