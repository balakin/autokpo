## REMOVED Requirements

### Requirement: Setup layout renders two form cards in order

**Reason**: The two-card stacked layout is superseded by the `SetupWizard`, which presents entity profile and signature forms as sequential steps in a guided wizard flow.  
**Migration**: `SetupLayout` is deleted. `App` renders `SetupWizard` instead. All behaviour covered by this requirement is now specified in `specs/setup-wizard/spec.md`.
