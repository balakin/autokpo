## ADDED Requirements

### Requirement: App-level leader election

The system SHALL expose app-level leader election independently from CRDT through a `LeaderProvider`. The provider SHALL supply a reactive `isLeader` boolean for render-time state and a `getIsLeader()` function for imperative callbacks that need fresh leader state.

#### Scenario: Render logic reads reactive leader state

- **WHEN** a component needs to conditionally mount leader-only UI or effects
- **THEN** it reads the reactive `isLeader` value from `LeaderProvider`

#### Scenario: Async callback reads current leader state

- **WHEN** an async callback, timer, or event handler needs to know whether the tab is currently leader
- **THEN** it calls `getIsLeader()` and receives the latest leader state instead of a stale render-time capture

### Requirement: Leader-owned session and sync side effects

Exactly one tab per origin SHALL act as the leader for shared side effects. The leader SHALL own session fetch, session revalidation, sign-in and logout requests, sync authority, and signed-out cleanup. Follower tabs SHALL request those actions from the leader rather than performing them directly.

#### Scenario: Follower requests logout through leader

- **WHEN** a follower tab triggers logout
- **THEN** it sends a logout request to the leader
- **AND** only the leader performs the shared logout side effects

#### Scenario: Sync authority stays leader-owned

- **WHEN** multiple signed-in tabs are open
- **THEN** only the leader performs backend sync traffic
- **AND** follower tabs mirror state through cross-tab coordination

### Requirement: Leader-published auth state propagation

The leader SHALL publish auth state transitions to all tabs through a dedicated auth coordination channel so that follower tabs converge on the same `loading`, `signed_out`, or `signed_in` state without performing duplicate backend work.

#### Scenario: Leader publishes signed-out transition

- **WHEN** the leader transitions auth state to `signed_out`
- **THEN** every healthy follower tab receives the transition
- **AND** each tab unmounts the signed-in subtree locally

#### Scenario: New follower requests current auth state

- **WHEN** a new follower tab starts without current auth state knowledge
- **THEN** it requests the current auth state from the leader
- **AND** the leader responds by publishing the current state

### Requirement: Leader-only signed-out cleaner

When auth state is `signed_out`, only the leader tab SHALL mount a cleaner that removes all app-owned user data from browser persistence while preserving device-scoped preferences.

#### Scenario: Cleaner wipes user data on signed-out mount

- **WHEN** the leader enters `signed_out`
- **THEN** the cleaner immediately removes all app-owned user-scoped IndexedDB databases and app-owned `localStorage` keys
- **AND** it preserves device-scoped keys such as theme preference

#### Scenario: Cleaner repeats periodic hygiene

- **WHEN** the leader remains in `signed_out`
- **THEN** the cleaner repeats its sweep periodically so stale user data left by earlier tabs is eventually removed
