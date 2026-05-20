## Context

Books are stored in a Yjs map keyed by UUID, and local validation prevents duplicate years only at create time on a single device. During offline concurrent creation on different devices, sync can converge to multiple books with the same `year`. For this iteration, the team wants visibility and user guidance rather than automatic reconciliation.

## Goals / Non-Goals

**Goals:**

- Detect duplicate years from current document state on the books page.
- Show a persistent warning with a bullet list of all duplicated years and counts.
- Mark each affected book row with a duplicate warning tag next to the year.
- Keep current CRUD and navigation behavior unchanged.

**Non-Goals:**

- Automatic merge of duplicate books.
- Preventing duplicates at protocol level or introducing server coordination.
- Blocking user actions (create/export/open) when duplicates exist.

## Decisions

1. Compute duplicate metadata in selectors, not in components.
   - Rationale: Keeps UI components declarative and centralizes domain projection logic in `book-selectors`.
   - Alternative considered: ad-hoc grouping logic directly in `BookLibrary`; rejected due to duplication and weaker testability.

2. Use persistent page alert (not toast) for duplicate warnings.
   - Rationale: Duplicate state is durable and may remain unresolved across sessions; transient notifications are easy to miss.
   - Alternative considered: toast on sync completion; rejected because warning context can disappear before user acts.

3. Surface both global and row-local signals.
   - Rationale: Global alert explains the problem scope; row tag helps users find actionable records quickly.
   - Alternative considered: only global alert; rejected because users must still scan all rows manually.

4. Preserve all existing actions.
   - Rationale: This iteration focuses on awareness and manual workflow with minimal behavioral risk.
   - Alternative considered: action blocking; deferred to a later iteration if needed.

## Risks / Trade-offs

- [Risk] Warning copy might not clearly explain manual resolution steps. -> Mitigation: Explicitly state to keep one book per year and delete others.
- [Risk] Many duplicate years can produce long alert content. -> Mitigation: Sort years descending and render concise bullet items (`year - N knjige`).
- [Trade-off] No auto-merge means temporary data inconsistency remains until user action. -> Mitigation: Per-row duplicate tags reduce resolution friction.

## Migration Plan

- No storage schema, sync protocol, or backend migration is required.
- Rollback is straightforward: remove duplicate-warning selector fields and UI rendering.

## Open Questions

- Should the warning also appear outside `/books` (e.g., dashboard) in a later iteration?
- Should we add a dedicated filter/action to show only duplicate rows if user feedback indicates discovery issues?
