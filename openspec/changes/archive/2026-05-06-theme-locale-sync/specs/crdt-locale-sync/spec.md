## ADDED Requirements

### Requirement: CrdtLocaleProvider replaces setLocale with a CRDT writer

The system SHALL render a `CrdtLocaleProvider` inside `CrdtProvider`, after `SyncEngine`. It SHALL read `locale` from the outer `LocaleContext` unchanged and replace `setLocale` in the context with a function that writes the new locale to `doc.getMap('user').set('locale', newLocale)` inside a `ydoc.transact()` call. It SHALL NOT write to `localStorage` directly — that is handled reactively by `LocaleSynchronizer`.

#### Scenario: User changes locale while signed in

- **WHEN** the user selects a new locale from the Settings page while signed in
- **THEN** `setLocale` in context SHALL write the new value to the CRDT doc via `ydoc.transact()`
- **AND** `localStorage` SHALL be updated reactively by `LocaleSynchronizer` on the next render cycle
- **AND** all other signed-in tabs SHALL receive the updated locale via their own `LocaleSynchronizer`

#### Scenario: Provider passes locale value through unchanged

- **WHEN** `CrdtLocaleProvider` renders
- **THEN** the `locale` value it provides SHALL equal the `locale` from the outer `LocaleContext`
- **AND** only `setLocale` SHALL be replaced in the context value

### Requirement: LocaleSynchronizer syncs remote CRDT locale updates to localStorage

The system SHALL render a `LocaleSynchronizer` component inside `CrdtLocaleProvider`, as a sibling to the inner `LocaleContext` override (not a child of it). `LocaleSynchronizer` SHALL call `useLocale()` to obtain the outer `setLocale` (localStorage writer). It SHALL use `useYDoc(localeSelector, Object.is)` to subscribe to the `user.locale` field of the Y.Doc and call `setLocale` via `useEffect` whenever the CRDT locale value changes, including on initial mount.

#### Scenario: Remote locale update propagates to localStorage

- **WHEN** another device changes the user's locale and the CRDT sync delivers the update
- **THEN** `LocaleSynchronizer`'s `useYDoc` subscription SHALL detect the change
- **AND** the `useEffect` SHALL call the outer `setLocale` with the new locale value
- **AND** `localStorage` SHALL be updated and `i18n.activate` SHALL be called
- **AND** the UI SHALL re-render with the new locale

#### Scenario: LocaleSynchronizer reads outer context, not inner

- **WHEN** `LocaleSynchronizer` calls `useLocale()`
- **THEN** it SHALL resolve to the outer `LocaleContext` (localStorage setter)
- **AND** it SHALL NOT call `setCrdtLocale` (which would create an echo loop)

#### Scenario: On mount, CRDT locale syncs to localStorage

- **WHEN** `CrdtLocaleProvider` mounts (user signs in, doc is ready)
- **THEN** `LocaleSynchronizer`'s `useEffect` SHALL fire with the current CRDT locale value
- **AND** `localStorage` SHALL be updated to match the CRDT value if it differs
