## Context

The app uses a system font stack for the UI (no explicit font configured in Tailwind/CSS) and PT Serif for PDF export, loaded from `public/fonts/PTSerif-*.ttf` via `react-pdf`. Font files live flat in `public/fonts/` alongside a single `OFL.txt` license. There is no `@font-face` declaration anywhere — the UI relies entirely on whatever sans-serif the OS provides.

## Goals / Non-Goals

**Goals:**

- Consistent Inter typography across all OSes and browsers in the UI
- No third-party network requests for fonts (GDPR)
- Clean per-family folder structure with co-located license files

**Non-Goals:**

- Changing the PDF font (PT Serif stays as-is)
- Variable font or full Inter glyph set — only the weights actually used in the UI
- Font subsetting / optimization beyond choosing woff2

## Decisions

### Font format: woff2 variable fonts

Inter ships as two variable font files covering the full `wght` (100–900) and `opsz` (optical size) axes:

- `InterVariable.woff2` — upright
- `InterVariable-Italic.woff2` — italic

Two files replace the entire static set (54 ttf variants). All browsers that can run a modern React app support variable fonts and woff2. The `opsz` axis is set automatically by the browser based on `font-size`, giving subtly better letterforms at small and large sizes for free.

### Loading mechanism: `@font-face` in `src/index.css`

Tailwind v4 uses `@theme` for design tokens. The `font-sans` token will be overridden to `'Inter', sans-serif`. The `@font-face` blocks go in `src/index.css` (already the global stylesheet), pointing to `/fonts/inter/Inter-*.woff2`.

Vite copies everything in `public/` verbatim — no import or bundling needed for font files placed there.

### Folder structure

```
public/fonts/
  inter/
    InterVariable.woff2
    InterVariable-Italic.woff2
    OFL.txt
  pt-serif/
    PTSerif-Regular.ttf
    PTSerif-Bold.ttf
    OFL.txt
```

Moving PT Serif into its subfolder requires updating the two path strings in `src/pdf/fonts.ts`.

### Font source

Download Inter from the official GitHub release (`rsms/inter`). The OFL license is included in the release archive.

## Risks / Trade-offs

- **Bundle / TTFB**: Two variable woff2 files add ~150 KB to public assets (vs. ~140 KB for two static weights, negligible difference). Woff2 compression mitigates this; the files are cached after first load.
- **PT Serif path update**: `src/pdf/fonts.ts` has hardcoded `/fonts/PTSerif-*.ttf` paths. Missing this update breaks PDF export silently (react-pdf falls back to Helvetica). → Covered in tasks; verify with a PDF smoke test.
- **Font swap flash (FOUT)**: `@font-face` without `font-display` defaults to `auto`. Adding `font-display: swap` ensures text is visible during font load but causes a brief layout shift. Acceptable trade-off for a data-entry app with no hero text.
