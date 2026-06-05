## Context

AutoKPO is a local-first, account-based web app for Serbian KPO records. The app currently lives in `apps/app` as a React PWA with a serious financial-dashboard style, app-derived light/dark tokens, Manrope for UI text, and JetBrains Mono for financial/tabular details. The public website introduces the product before users open the authenticated app at `https://app.autokpo.com`.

The landing page targets Serbian Latin-speaking preduzetnici and paušalci. It explains the product in plain language, builds trust through free/open-source positioning, and describes the implemented account and encryption model: sign-in uses email, Google, or GitHub accounts; account/auth data is stored separately for login; KPO book data is locally available and synchronized with the server in encrypted form; trust copy broadly says data is end-to-end encrypted, while FAQ copy says encryption/decryption happens on the user's device and references Argon2id and AES-256-GCM.

The implementation uses the existing `apps/website` Astro package and replaces the starter page, starter layout, starter component, and starter assets with the landing page, local fonts, favicon set, and theme-aware GitHub assets.

## Goals / Non-Goals

**Goals:**

- Build a single-page Astro landing site for `autokpo.com` in `apps/website/src/pages/index.astro`.
- Use Astro, native HTML, inline global plain CSS, minimal vanilla JavaScript, and Astro icon components only; do not add React or UI kits.
- Match the app's serious “calm fiscal instrument” tone: soft OKLCH surfaces, precise cards, a ledger-style hero mockup, mono numeric details, and restrained motion.
- Support light and dark themes with system preference default and a visible, accessible theme toggle.
- Provide Serbian Latin content for a sticky header, hero, features, trust/security, FAQ accordion, final CTA, and footer.
- Make `Otvori aplikaciju` the primary CTA and GitHub the secondary link.
- Include careful legal boundary copy without implying official correctness or tax/legal advice.

**Non-Goals:**

- No React, Preact, Svelte, Vue, Alpine, or client-side UI framework for page sections.
- No Astro UI kit, CSS component library, or generic SaaS template; `@lucide/astro` icons are acceptable presentation assets.
- No pricing page or pricing section; the app is free.
- No privacy policy, terms page, blog, docs, or multi-page website in this iteration.
- No Cloudflare deployment configuration in this iteration.
- No changes to the existing `apps/app` runtime behavior.

## Decisions

### Use custom Astro components and plain CSS

Build the landing as one Astro page with native HTML sections, Astro icon components, and a compact custom CSS system in a global style block. Plain CSS gives better control over the app-aligned visual language than a UI kit, and the one-page scope does not require component extraction.

Alternatives considered:

- **Astro UI kit**: faster initial components, but likely generic styling, dependency overhead, and weaker alignment with the app.
- **Tailwind**: productive, but unnecessary for a small static landing and can make the page feel utility-template driven.
- **React islands**: unnecessary because the only interaction is theme toggling, which can be handled with minimal vanilla JavaScript.

### Mirror the app visual language, not the app component library

The website should reuse the app's token concepts and typography rather than importing app UI code. CSS variables model the app's `--background`, `--surface`, `--surface-secondary`, `--overlay`, `--foreground`, `--muted`, `--default`, `--accent`, `--accent-soft`, `--success`, `--warning`, `--danger`, `--border`, `--separator`, `--surface-shadow`, `--overlay-shadow`, and related dark-mode values using OKLCH colors.

The design should feel like a public expression of the app: calm, precise, and trustworthy. It should avoid flashy SaaS tropes, purple gradients, exaggerated glassmorphism, and playful illustrations.

### Theme strategy

Set theme on the document with `data-theme="light"` or `data-theme="dark"` and mirror dark mode with a `.dark` class for CSS selectors. On first load, use `localStorage.getItem("autokpo-theme")` if present, otherwise follow `prefers-color-scheme`. Provide a visible theme toggle that updates localStorage, `data-theme`, `.dark`, `aria-pressed`, and the button label.

The implementation includes a small inline early script in the page head to avoid a noticeable wrong-theme flash before CSS loads, plus a second inline script at the end of the page for the toggle.

### Content structure

The page should use this structure:

1. Sticky header with wordmark, navigation to features/security/FAQ, theme toggle, and primary app CTA.
2. Hero with free/open-source badge, headline, supporting copy, primary/secondary CTAs, and a decorative KPO ledger mockup.
3. Feature section covering KPO books, income entries, income overview with paušal limit, PDF/export, encrypted sync, and open source.
4. Trust/security section covering email/OAuth login, device synchronization, end-to-end encryption, and open-source verification.
5. FAQ accordion covering free/open-source status, non-official/legal boundary, data storage, server-readable KPO data, account requirement, and offline/PWA availability.
6. Final CTA.
7. Footer with project author note, GitHub link, and AGPL-3.0 license badge.

### Copy and claims

Use Serbian Latin only. Use confident product language, but avoid official/legal guarantees. The FAQ and trust copy must explicitly state that AutoKPO is a helper tool and is not legal, tax, bookkeeping, or official advice.

Data wording should distinguish:

- account/auth data needed for login, such as email and linked Google/GitHub accounts;
- KPO book/application data, which is locally available and synchronized to the server in encrypted form;
- broad trust-section end-to-end encryption copy, plus FAQ readable-content claims paired with implementation-level wording about Argon2id-derived keys and AES-256-GCM encryption.

### Assets and dependencies

Bundle Manrope and JetBrains Mono from `apps/website/public/fonts`, with license files retained. Add the landing favicon set under `apps/website/public` and theme-aware GitHub SVG assets under `apps/website/src/assets`.

Use `@lucide/astro` for inline icons in the page and `@astrojs/check` in the package build command so `pnpm -s build` runs `astro check --tsconfig tsconfig.app.json && astro build`.

## Risks / Trade-offs

- **Risk: Website copy overpromises legal correctness** → Mitigation: use helper-tool wording and include a clear non-advice FAQ answer.
- **Risk: Privacy copy overgeneralizes encryption claims** → Mitigation: keep FAQ wording explicit about account/auth data being stored separately for login and KPO data being synchronized encrypted.
- **Risk: Plain CSS duplicates app tokens manually** → Mitigation: keep the website token set small and app-aligned rather than attempting a shared package in this iteration.
- **Risk: Theme flash on load** → Mitigation: set `data-theme` with an early inline script before rendering theme-dependent surfaces.
- **Risk: Page becomes generic SaaS marketing** → Mitigation: anchor the visual language in KPO/ledger/dashboard details, app palette, and serious Serbian copy.

## Migration Plan

- Use the existing Astro package in `apps/website`.
- Replace starter files with `src/pages/index.astro`, local fonts, favicon assets, and GitHub SVG assets.
- Build the landing as static Astro output with `astro check` before `astro build`.
- Keep deployment configuration out of scope; Cloudflare setup will be handled in a later iteration.
- Rollback is removal of the new `apps/website` landing changes or reverting the package to its prior scaffold state.

## Open Questions

- None for V1 implementation. Privacy/legal pages and deployment setup are intentionally deferred.
