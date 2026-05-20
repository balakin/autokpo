## MODIFIED Requirements

### Requirement: Selector-based React hook for reading Y.Doc state

The system SHALL expose a `useYDoc(selector, isEqual?)` hook that reads a slice of the Y.Doc using the caller's selector function and re-renders only when the equality function reports a change. The hook SHALL subscribe to the document's `afterTransaction` event and SHALL be implemented on top of `useSyncExternalStoreWithSelector` from `use-sync-external-store/with-selector`. When callers omit `isEqual`, the hook SHALL default to `shallowEqual`. Callers SHALL design selectors to return shallow-friendly projections such as primitives, flat objects, or minimal arrays of flat items.

#### Scenario: Selector returns a primitive

- **WHEN** a component subscribes via `useYDoc((doc) => doc.getMap('books').size)`
- **THEN** the component re-renders only when the size of the books map changes

#### Scenario: Selector uses default shallow equality for flat objects

- **WHEN** a component subscribes via `useYDoc((doc) => ({ locale: doc.getMap('user').get('locale') }))` and an unrelated field changes in the document
- **THEN** the component SHALL NOT re-render because the selector result remains shallow-equal to the previous render

#### Scenario: Selector returns an array with shallow equality

- **WHEN** a component subscribes via `useYDoc(selector, shallowEqual)` where the selector returns an array of primitives
- **THEN** the component re-renders only when the array's elements differ from the previous render

#### Scenario: Many small edits within one transaction trigger one render

- **WHEN** code performs multiple `Y.Map.set` and `Y.Array.push` operations inside a single `ydoc.transact(() => …)` block
- **THEN** subscribed components re-render at most once per transaction (because the hook subscribes to `afterTransaction`, not to per-edit `update` events)
