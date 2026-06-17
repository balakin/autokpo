# Content Security Policy

The app ships a Content Security Policy (and a few related security headers) via a `dist/_headers` file generated at build time by the `generate-csp-headers` plugin in [`vite.config.ts`](../vite.config.ts). After the production bundle is written, the plugin reads `index.html`, computes SHA-256 hashes of its inline `<script>` tags, and emits the policy below. Cloudflare serves `_headers` on every asset response.

Unlike the [website](../../website/README.md#content-security-policy)'s strict hash-only policy, the app policy must relax a few directives for WebAssembly and component-level inline styling — each exception is deliberate and documented here.

## Directives

| Directive      | Value                                                                       | Why                                                                                                                                              |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default-src`  | `'none'`                                                                    | Deny by default; everything allowed is listed explicitly below.                                                                                  |
| `script-src`   | `'self' 'unsafe-eval' https://challenges.cloudflare.com` + per-build hashes | `'unsafe-eval'` is required by **hash-wasm** (the E2EE unlock flow); Turnstile loads its challenge script; hashes cover Vite/PWA inline scripts. |
| `style-src`    | `'self' 'unsafe-inline'`                                                    | HeroUI / React Aria apply inline styles for layout and animation, so a hash/nonce approach isn't workable.                                       |
| `font-src`     | `'self'`                                                                    | All fonts are self-hosted; no external font CDN.                                                                                                 |
| `img-src`      | `'self' data:`                                                              | `data:` for base64-encoded images (e.g. images embedded in generated PDFs).                                                                      |
| `connect-src`  | `'self' data:` (+ `VITE_POSTHOG_HOST` when set)                             | `data:` is required by react-pdf's Emscripten WASM, which fetches its base64 data-URI binary; PostHog host added only when analytics configured. |
| `frame-src`    | `https://challenges.cloudflare.com`                                         | Turnstile renders its challenge inside an iframe.                                                                                                |
| `worker-src`   | `'self'`                                                                    | Service worker (PWA), react-pdf / fflate decompression workers, and hash-wasm key-derivation workers.                                            |
| `manifest-src` | `'self'`                                                                    | PWA web app manifest.                                                                                                                            |
| `base-uri`     | `'self'`                                                                    | Prevent `<base>`-tag injection attacks.                                                                                                          |

## Other headers

The same `_headers` file also sets:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Why `'unsafe-eval'` can't be removed

The E2EE unlock flow derives keys with **hash-wasm**, whose compiled WebAssembly module instantiates via `eval`. Dropping `'unsafe-eval'` from `script-src` breaks key derivation, which breaks the entire encryption (and therefore sync) flow. This is a load-bearing exception — see [`e2ee.md`](./e2ee.md) for the key hierarchy that depends on it.

## Adding a new external origin

When introducing a dependency that talks to a new origin (an API, a CDN, an embed), add the origin to the **narrowest** directive that covers it (`connect-src` for fetch/XHR/WebSocket, `frame-src` for iframes, `script-src` for scripts, etc.) in `generate-csp-headers`. Prefer adding a specific host over loosening to a wildcard or adding `'unsafe-*'`. Verify the result by loading the production build and checking the browser console for CSP violation reports.
