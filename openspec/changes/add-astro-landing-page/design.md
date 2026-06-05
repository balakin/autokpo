## Context

AutoKPO is a local-first, account-based web app for Serbian KPO records. The app currently lives in `apps/app` as a React PWA with a serious financial-dashboard style, app-derived light/dark tokens, Manrope for UI text, and JetBrains Mono for financial/tabular details. The public website should introduce the product before users open the authenticated app at `https://app.autokpo.com`.

The landing page targets Serbian Latin-speaking preduzetnici and paušalci. It should explain the product in plain language, build trust through free/open-source positioning, and accurately describe data handling: account/auth data is stored for login, while KPO document content is stored locally and synchronized through encrypted server-side documents.

The repository currently does not show `apps/website` in the working tree, even though the product decision is to place the landing site there. Implementation should use `apps/website` and create/scaffold missing files as needed.

## Goals / Non-Goals

**Goals:**

- Build a single-page Astro landing site for `autokpo.com` in `apps/website`.
- Use Astro components and plain CSS only, without React or UI kits.
- Match the app's serious “calm fiscal instrument” tone: soft Nordic surfaces, precise financial cards, quiet grid/ledger details, and restrained motion.
- Support light and dark themes with system preference default and a visible, accessible theme toggle.
- Provide Serbian Latin content for hero, features, trust/security, FAQ, final CTA, and footer.
- Make `Otvori aplikaciju` the primary CTA and GitHub the secondary link.
- Include careful legal boundary copy without implying official correctness or tax/legal advice.

**Non-Goals:**

- No React, Preact, Svelte, Vue, Alpine, or client-side UI framework.
- No Astro UI kit, CSS component library, or generic SaaS template.
- No pricing page or pricing section; the app is free.
- No privacy policy, terms page, blog, docs, or multi-page website in this iteration.
- No Cloudflare deployment configuration in this iteration.
- No changes to the existing `apps/app` runtime behavior.

## Decisions

### Use custom Astro components and plain CSS

Build the landing from first-party `.astro` components and a small custom CSS system. Astro scoped styles and global CSS are sufficient for this one-page static site, and plain CSS gives better control over the app-aligned visual language than a UI kit.

Alternatives considered:

- **Astro UI kit**: faster initial components, but likely generic styling, dependency overhead, and weaker alignment with the app.
- **Tailwind**: productive, but unnecessary for a small static landing and can make the page feel utility-template driven.
- **React islands**: unnecessary because the only interaction is theme toggling, which can be handled with minimal vanilla JavaScript.

### Mirror the app visual language, not the app component library

The website should reuse the app's token concepts and typography rather than importing app UI code. CSS variables should model the app's `--background`, `--surface`, `--surface-secondary`, `--foreground`, `--muted`, `--border`, `--accent`, `--accent-soft`, `--surface-shadow`, and related dark-mode values.

The design should feel like a public expression of the app: calm, precise, and trustworthy. It should avoid flashy SaaS tropes, purple gradients, exaggerated glassmorphism, and playful illustrations.

### Theme strategy

Set theme on the document with `data-theme="light"` or `data-theme="dark"`. On first load, use saved preference from localStorage if present, otherwise follow `prefers-color-scheme`. Provide a visible theme toggle that updates localStorage and the document attribute.

The implementation should include a small inline early script in the page head or layout to avoid a noticeable wrong-theme flash before CSS loads.

### Content structure

The page should use this structure:

1. Header with navigation, GitHub link, theme toggle, and primary app CTA.
2. Hero with headline, supporting copy, and primary/secondary CTAs.
3. Feature section covering KPO books, income entries, income overview, PDF export, encrypted sync, and open source.
4. Trust/security section covering free/open-source, account-based sync, local availability, encrypted KPO documents, and account data distinction.
5. FAQ section.
6. Final CTA.
7. Footer with GitHub, AGPL-3.0, and open-source note.

### Copy and claims

Use Serbian Latin only. Use confident product language, but avoid official/legal guarantees. The FAQ and trust copy must explicitly state that AutoKPO is a helper tool and is not legal, tax, bookkeeping, or official advice.

Data wording must avoid claiming the server stores nothing. It should distinguish:

- account/auth data needed for login, such as email and linked OAuth accounts;
- KPO application data/document content, which is locally available and stored on the server only as encrypted sync documents.

## Risks / Trade-offs

- **Risk: Website copy overpromises legal correctness** → Mitigation: use helper-tool wording and include a clear non-advice FAQ answer.
- **Risk: Privacy copy implies zero server data** → Mitigation: explicitly distinguish auth/account data from encrypted KPO documents.
- **Risk: Plain CSS duplicates app tokens manually** → Mitigation: keep the website token set small and app-aligned rather than attempting a shared package in this iteration.
- **Risk: Theme flash on load** → Mitigation: set `data-theme` with an early inline script before rendering theme-dependent surfaces.
- **Risk: Page becomes generic SaaS marketing** → Mitigation: anchor the visual language in KPO/ledger/dashboard details, app palette, and serious Serbian copy.

## Migration Plan

- Add or complete `apps/website` as an Astro package if missing.
- Build the landing as static Astro output.
- Keep deployment configuration out of scope; Cloudflare setup will be handled in a later iteration.
- Rollback is removal of the new `apps/website` landing changes or reverting the package to its prior scaffold state.

## Open Questions

- None for V1 implementation. Privacy/legal pages and deployment setup are intentionally deferred.
