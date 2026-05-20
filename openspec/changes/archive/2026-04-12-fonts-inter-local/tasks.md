## 1. Reorganize font assets

- [x] 1.1 Create `public/fonts/pt-serif/` and move `PTSerif-Regular.ttf`, `PTSerif-Bold.ttf`, and `OFL.txt` into it
- [x] 1.2 Create `public/fonts/inter/` and add `InterVariable.woff2`, `InterVariable-Italic.woff2`, and `OFL.txt` into it
- [x] 1.3 Delete the now-empty `public/fonts/` root-level font files (old flat layout)

## 2. Update PT Serif paths

- [x] 2.1 Update `src/pdf/fonts.ts` to reference `/fonts/pt-serif/PTSerif-Regular.ttf` and `/fonts/pt-serif/PTSerif-Bold.ttf`

## 3. Configure Inter in global CSS

- [x] 3.1 Add `@font-face` blocks to `src/index.css` for Inter upright and italic, pointing to `/fonts/inter/InterVariable.woff2` and `/fonts/inter/InterVariable-Italic.woff2`, with `font-weight: 100 900`, `font-style: normal` / `italic`, and `font-display: swap`
- [x] 3.2 Override the Tailwind `font-sans` token in `src/index.css` via `@theme` to `'Inter', sans-serif`

## 4. Verify

- [x] 4.1 Run `pnpm build` and confirm no type or bundle errors
- [x] 4.2 Open the app in a browser and confirm Inter is rendered (DevTools → computed font-family)
- [x] 4.3 Generate a PDF and confirm PT Serif renders correctly (no fallback font)
- [x] 4.4 Confirm no requests to external font servers in the Network tab
