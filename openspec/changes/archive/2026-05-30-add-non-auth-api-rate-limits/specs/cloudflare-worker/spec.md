## ADDED Requirements

### Requirement: Worker rate-limit binding configuration

The worker SHALL declare Cloudflare Workers Rate Limiting binding configuration for authenticated non-auth application API route groups, and generated worker types SHALL expose the binding to Worker code.

#### Scenario: Wrangler declares rate-limit binding

- **WHEN** `wrangler.jsonc` is loaded
- **THEN** it declares the Cloudflare Workers Rate Limiting binding configuration required by the non-auth API limiter

#### Scenario: Generated types include rate-limit binding

- **WHEN** `pnpm generate:worker-types` is run after the binding is configured
- **THEN** `apps/app/worker-configuration.d.ts` includes the rate-limit binding on the worker `Env` type
