## Context

The project uses Lingui v5.9.5 for i18n with a specific build pipeline: `@lingui/vite-plugin` for HMR/catalog compilation, `@lingui/babel-plugin-lingui-macro` running inside `@rolldown/plugin-babel` alongside the React Compiler preset (which must run _after_ macros expand), and `eslint-plugin-lingui` for linting. Lingui v6.0.0 was released Apr 22, 2026 — the first major since v5. The project is on Vite 8, Node 24+, and already uses `defineConfig` in `lingui.config.ts`. There are 40 ESLint deprecation warnings on `/macro` imports. Message IDs will change to URL-safe Base64 encoding, affecting all 3 PO catalogs.

## Goals / Non-Goals

**Goals:**

- Upgrade all `@lingui/*` packages to v6.0.0 with zero build/test regressions
- Resolve all 40 `import-x/no-deprecated` ESLint warnings
- Preserve the "macros expand before React Compiler" invariant in the build pipeline
- Re-extract PO catalogs and verify translation integrity after message ID changes
- Adopt `linguiTransformerBabelPreset()` if it simplifies the vite config without breaking plugin ordering
- Ensure `eslint-plugin-lingui@0.13.1` works with v6

**Non-Goals:**

- Adopting the `ph()` macro or `jsxPlaceholderDefaults` config (separate enhancement, not blocking)
- Removing `@rolldown/plugin-babel` from the build pipeline (React Compiler still needs it)
- Switching to SWC plugin (project uses Babel for React Compiler compatibility)
- Changing source locale or adding new locales
- Migrating PO format to JSON or any other catalog format

## Decisions

### D1: Keep current babel plugin approach (not `linguiTransformerBabelPreset`)

**Decision**: Keep `@lingui/babel-plugin-lingui-macro` as an explicit Babel **plugin** (not using the new convenience preset `linguiTransformerBabelPreset()`).

**Rationale**: The current vite config uses `@rolldown/plugin-babel` with the macro as a **plugin** and React Compiler as a **preset**. In Babel, plugins always run before presets. If we used `linguiTransformerBabelPreset()`, it would become a preset running alongside or after the React Compiler preset, and the ordering would depend on preset array position — a fragile guarantee. The explicit plugin approach guarantees macros expand first.

**Alternative considered**: `linguiTransformerBabelPreset()` (new in v6) — cleaner config but risks the ordering invariant if Babel preset ordering changes. Not worth the risk.

### D2: Add new `@lingui/vite-plugin` peerDeps explicitly

**Decision**: Declare `@babel/core`, `@lingui/babel-plugin-lingui-macro`, `@rolldown/plugin-babel`, and `rolldown` as explicit devDependencies since v6 lists them as peerDeps on `@lingui/vite-plugin`.

**Rationale**: pnpm enforces peer dependency resolution. All four are already in `devDependencies` or transitive deps, but explicit declaration avoids `ERESOLVE` errors during install.

### D3: Re-extract catalogs, do not manual-replace message IDs

**Decision**: Run `pnpm i18n:extract` after the upgrade to regenerate all PO files with new URL-safe message IDs. Review the diff for translation integrity rather than trying to manually find-replace `+` → `-` and `/` → `_` in existing files.

**Rationale**: The v6 migration guide recommends re-compilation. Since the project already has `failOnMissing: true` and `failOnCompileError: true`, any broken IDs will surface immediately. Manual search-replace in PO files is error-prone — auto-generated IDs are computed from source strings and the extractor is the authority.

### D4: Keep `eslint-plugin-lingui@0.13.1`

**Decision**: Keep the current version. It only has `eslint` and `typescript` as peerDeps (no Lingui version pin), so it should work with v6.

**Rationale**: v0.13.1 is the latest and has no Lingui-specific peer dependency. If incompatibilities surface during testing, we'll upgrade then.

### D5: Verify `compileNamespace: 'es'` still supported

**Decision**: Keep the config option and verify it works. If v6 drops it, switch to the ESM-only default (which is now the only mode anyway).

**Rationale**: v6 is ESM-only. `compileNamespace: 'es'` produces ES module output, which aligns with v6's distribution model. If the option is removed, the default behavior should already be ESM.

## Risks / Trade-offs

- **[Message ID drift]** → Auto-generated message IDs change from standard Base64 to URL-safe Base64. Existing translations with changed IDs could become orphaned. Mitigated by `failOnMissing: true` — any orphaned key will cause a build failure. After re-extraction, we audit the diff to confirm no translations were lost.
- **[Type breakage from null → undefined]** → Lingui v6 uses `undefined` instead of `null` for optional values. The project doesn't directly use Lingui internal types, so risk is low. Full typecheck after upgrade will catch any issues.
- **[ESLint warnings persist with v6]** → The 40 `import-x/no-deprecated` warnings may or may not resolve with v6 packages. If they persist, we need to check whether v6 still marks `/macro` subpaths as deprecated or if it's a false positive from the v5 type definitions. Mitigated by upgrading first, then checking.
- **[Babel plugin ordering regression]** → Keeping the current plugin/preset ordering should preserve correctness. Mitigated by running the full test suite after upgrade.
- **[Lingui v6 post-release bugs]** → v6.0.0 was released 3 days ago. There may be undiscovered issues. Mitigated by thorough testing and the ability to pin to 6.0.0 and await patches.
