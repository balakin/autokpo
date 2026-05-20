## Why

`@iconify/react` fetches icon SVGs from the Iconify CDN at runtime, introducing a network dependency and potential offline/latency failures. `react-icons` bundles icons at build time — no CDN, no network round-trips, tree-shakeable.

## What Changes

- Remove `@iconify/react` dependency and all `<Icon icon="gravity-ui:*" />` usages.
- Add `react-icons` dependency (Font Awesome 6 subset via `react-icons/fa6`).
- Replace each `<Icon icon="gravity-ui:*" />` with the equivalent FA6 component:

| gravity-ui icon          | FA6 component  | Files                                                    |
| ------------------------ | -------------- | -------------------------------------------------------- |
| `gravity-ui:pencil`      | `FaPencil`     | entity-profile-preview, entries-table, signature-preview |
| `gravity-ui:trash-bin`   | `FaTrashCan`   | entries-table                                            |
| `gravity-ui:tray`        | `FaInbox`      | entries-table                                            |
| `gravity-ui:book`        | `FaBook`       | welcome-step                                             |
| `gravity-ui:arrow-right` | `FaArrowRight` | welcome-step                                             |
| `gravity-ui:check`       | `FaCheck`      | stepper-label                                            |
| `gravity-ui:plus`        | `FaPlus`       | working-layout                                           |

- Update CLAUDE.md icon convention to document `react-icons/fa6` as the standard.

## Capabilities

### New Capabilities

- `icon-system`: Icon rendering via `react-icons` FA6 — import, sizing, and usage conventions.

### Modified Capabilities

- `entity-profile-preview`: Icon implementation changes (FA6 `FaPencil` replaces `gravity-ui:pencil`) — behavior unchanged.
- `signature-preview`: Icon implementation changes (FA6 `FaPencil` replaces `gravity-ui:pencil`) — behavior unchanged.
- `entry-management`: Icon implementation changes (FA6 components replace gravity-ui icons) — behavior unchanged.
- `working-layout`: Icon implementation changes (FA6 `FaPlus` replaces `gravity-ui:plus`) — behavior unchanged.
- `stepper`: Icon implementation changes (FA6 `FaCheck` replaces `gravity-ui:check`) — behavior unchanged.
- `setup-wizard`: Icon implementation changes (FA6 components replace gravity-ui icons) — behavior unchanged.

## Impact

- **Dependencies**: remove `@iconify/react` ^6.0.2; add `react-icons` (latest).
- **Files changed**: 6 source files + `package.json` + `CLAUDE.md`.
- **No behavioral change**: icon shape/semantics preserved via equivalent FA6 icons.
- **Bundle**: icons now bundled at build time → smaller at runtime, no CDN calls.
