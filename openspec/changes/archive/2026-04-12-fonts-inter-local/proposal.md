## Why

The app currently uses the system font stack, which produces different typography across operating systems and devices. Switching to a single self-hosted typeface (Inter) gives every user the same visual experience. Google Fonts is explicitly avoided to stay GDPR-compliant — no user IP is sent to third-party servers.

## What Changes

- Reorganize `public/fonts/` into per-family subfolders so each font can carry its own license file:
  - `public/fonts/pt-serif/` — move existing PT Serif ttf files and `OFL.txt` here
  - `public/fonts/inter/` — add Inter woff2 files and its own `OFL.txt` here
- Update any existing references to PT Serif font paths (used in PDF export)
- Declare `@font-face` rules in the global CSS for Inter, pointing to `public/fonts/inter/`
- Replace the system font stack with Inter in the Tailwind / global CSS configuration

## Capabilities

### New Capabilities

- `local-fonts`: Self-hosted Inter font loaded via `@font-face` with no external network requests

### Modified Capabilities

<!-- No existing spec-level requirements change -->

## Impact

- `public/fonts/`: restructured into `pt-serif/` and `inter/` subfolders
- Any code referencing `/fonts/PTSerif-*.ttf` must be updated to `/fonts/pt-serif/PTSerif-*.ttf`
- Global CSS / Tailwind config: replace system font stack with Inter
- Bundle/public asset size increases slightly (Inter woff2 files added)
- No functional or behavioral changes; purely typography and asset organization
