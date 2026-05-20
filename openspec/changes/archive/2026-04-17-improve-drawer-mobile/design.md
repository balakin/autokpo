## Context

The `MobileDrawer` component (`src/app-shell/mobile-drawer.tsx`) wraps the `Sidebar` in a HeroUI v3 `Drawer`. Currently it is sized at `w-60 max-w-[80vw]`, which leaves a visible backdrop strip on very narrow viewports and provides no affordance to close the drawer other than tapping that strip. The change is self-contained to a single component and its spec delta.

## Goals / Non-Goals

**Goals:**

- Make the drawer occupy the full viewport width and height on mobile.
- Add an explicit close button inside the drawer so users can dismiss it without tapping outside.

**Non-Goals:**

- Changing desktop sidebar layout.
- Redesigning sidebar content or navigation items.
- Animating the close button or adding swipe-to-close gestures.

## Decisions

**Full-screen sizing via Tailwind classes** — Set `w-screen h-screen` (or `w-full h-full`) on `Drawer.Content` instead of a fixed width. This is the simplest approach and aligns with HeroUI v3 class-based overrides. Alternative: using the `size` prop if HeroUI exposes one — but checking HeroUI v3 docs is required before implementation to confirm the correct API.

**Close button placement** — A close button (×) is placed at the top-right of the drawer header area, outside the `Sidebar` component so the sidebar itself does not need to know about the drawer. The `onOpenChange(false)` callback is passed down to `MobileDrawer` and invoked on click.

**Icon** — `LuX` from `react-icons/lu` to stay consistent with the project icon convention.

## Risks / Trade-offs

- [HeroUI v3 Drawer API may differ from assumed props] → Mitigation: consult `mcp__heroui-react__get_component_docs` before writing code.
- [Full-screen drawer may feel heavy on tablets at the `md` breakpoint] → Accepted; the drawer is only shown below `lg` and tablets typically have room for the sidebar inline at `lg`.
