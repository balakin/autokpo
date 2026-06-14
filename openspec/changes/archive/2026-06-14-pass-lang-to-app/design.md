## Context

The website (`autokpo.com`) and app (`app.autokpo.com`) live on separate origins. When a visitor browses the Russian website and clicks "Open App," the app opens with no knowledge of the visitor's language choice — it falls through its own locale resolution (localStorage → `navigator.language` → `en`). The website currently links to a bare `https://app.autokpo.com` with no locale signal.

The app's locale resolution lives in `readLocale()` (`src/i18n/locale-storage.ts`), a synchronous function called during `useState` initialization in `LocaleProvider`. It checks localStorage, then `navigator.language`, then defaults to `'en'`.

## Goals / Non-Goals

**Goals:**

- When a user clicks "Open App" from a non-English website page, the app opens in that language on first visit
- Once a user has an in-app locale preference (in localStorage), that preference takes priority over the website hint
- The query parameter is invisible after consumption (URL is cleaned)

**Non-Goals:**

- No bidirectional sync — changing locale in the app does not update the website
- No cookie-based or postMessage-based communication between the two origins
- No Accept-Language header processing in the worker
- No deep-linking beyond locale (the app URL stays clean after hint consumption)

## Decisions

### Decision 1: Query parameter (`?lang=`) rather than path segment or hash

**Chosen:** `?lang=ru` query parameter on the default app URL.

**Alternatives considered:**

| Approach                                   | Pros                                                                  | Cons                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `?lang=ru` (chosen)                        | Simple, transparent, works with any URL structure, no routing changes | Visible in address bar before cleanup                                           |
| Path prefix `/ru/`                         | Clean URL, RESTful                                                    | Requires SPA router to handle locale prefix, affects all routes, heavier change |
| Hash `#lang=ru`                            | Never sent to server, no service worker interference                  | Unconventional, feels like a hack                                               |
| `localStorage` set via cross-origin iframe | Invisible to user                                                     | Complex, blocked by third-party cookie restrictions, fragile                    |

The query parameter is the simplest mechanism that works across origins without server or router changes. The URL cleanup (`history.replaceState`) keeps it invisible after consumption.

### Decision 2: Hint semantics (not override)

**Chosen:** Query param only used when localStorage is empty ("first visit hint").

```text
Priority:  localStorage  →  ?lang=  →  navigator.language  →  'en'
```

Once `readLocale()` sees a valid localStorage value, it returns early — the query param is never consulted. This means:

- First visit from Russian website → app opens in Russian (hint applied, persisted to localStorage)
- User changes to English in the app → stored in localStorage
- User visits Russian website again, clicks "Open App" → app opens in English (localStorage wins, hint ignored)

**Alternative considered:** Always override with `?lang=`. This would cause the app to switch languages every time the user opens it from a non-English website page, which could disorient returning users who set a different in-app preference.

### Decision 3: No URL cleanup

**Chosen:** The `?lang=` parameter is left in the URL after consumption — no `history.replaceState` cleanup.

**Rationale:** The param is inert after first consumption (localStorage takes priority on subsequent reads). React Router naturally replaces the URL on the first in-app navigation, removing the param without manual intervention. Avoiding `replaceState` also eliminates risk of corrupting history state that frameworks may rely on.

### Decision 4: Same locale codes as the website

No mapping needed — the website and app already use identical locale codes (`sr-Latn`, `en`, `ru`). Both derive from the same `LandingContent.locale` / `Locale` type system.

## Risks / Trade-offs

- **Risk:** User bookmarks `app.autokpo.com?lang=ru` → the param persists in the bookmark. **Mitigation:** The param is harmless — it's only consumed when localStorage is empty. On subsequent visits, localStorage has a value and the param is ignored.
- **Risk:** Service worker caches the `?lang=ru` URL separately from the root URL. **Mitigation:** The PWA's service worker serves the same `index.html` regardless of query params, so no cache fragmentation.
- **Trade-off:** The query param remains visible in the address bar until the user navigates within the app. React Router replaces the URL on the first route change, so the param disappears naturally.

## Open Questions

None — the change is narrow and well-understood.
