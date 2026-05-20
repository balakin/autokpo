## Context

KPO previously used a "Fiscal Modernism" theme: warm cream backgrounds in light mode and a deep navy in dark mode, with a sidebar that was always dark regardless of the active theme. The CSS variable set was minimal and didn't cover overlays, form fields, shadows, or secondary accent tones — leaving HeroUI components partially unstyled and requiring ad-hoc inline styles.

## Goals / Non-Goals

**Goals:**

- Replace the color palette with a unified arctic blue-gray system that works coherently in both light and dark modes
- Make the sidebar theme-aware (light in light mode, dark in dark mode)
- Expand the CSS custom property surface to cover all HeroUI theming hooks: `--overlay`, `--field-*`, `--segment`, shadow variables, `--accent-soft`
- Replace the hand-rolled version badge span with the HeroUI `Chip` component
- Clean up minor component inconsistencies (Surface wrapper in modal, button variant, title casing)

**Non-Goals:**

- Introducing a runtime theme switcher UI (already exists via `data-theme`)
- Typography changes beyond what already existed (Manrope + JetBrains Mono)
- Changing layout structure or component hierarchy

## Decisions

**Single CSS file for all tokens**
All custom properties live in `src/index.css`. Splitting into separate token files adds indirection with no benefit at this scale.

**`@theme inline` for Tailwind exposure**
Sidebar color vars and `--accent-soft` are exposed via `@theme inline` so they're available as Tailwind utilities (`bg-sidebar-bg`, `text-accent-soft-foreground`, etc.) without duplicating values.

**Theme selector strategy**
Light tokens on `:root`, dark tokens on `.dark, [data-theme='dark']` — matches HeroUI's expected selector pattern and React's class-based dark mode toggle.

**Sidebar color approach**
Light mode sidebar uses `oklch(0.935 0.008 240)` — slightly darker than `--background` — to provide visual separation without a harsh contrast jump. Dark mode sidebar uses `oklch(0.18 0.015 255)` — slightly lighter than `--background` — for the same reason but inverted.

**HeroUI Chip for version badge**
The previous inline `<span>` with hand-coded `oklch()` relative color syntax was fragile and duplicated theming logic. `<Chip size="sm" variant="soft" color="success">` delegates appearance to the design system.

**Remove Surface from EntryModal**
`Surface` added a redundant background layer inside the modal body which already has its own surface treatment via the Modal component. Removing it flattens the visual hierarchy correctly.

## Risks / Trade-offs

- [HeroUI v3 beta instability] Token names or Chip API may change in future beta releases → Mitigation: pin HeroUI version, review on each upgrade
- [oklch browser support] All color values use oklch; unsupported in very old browsers → Accepted: project targets modern browsers only
