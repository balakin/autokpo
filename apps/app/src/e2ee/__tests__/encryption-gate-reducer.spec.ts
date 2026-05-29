import { describe, expect, it } from 'vitest';

import type { DekEntry } from '../encryption-crypto';
import {
  encryptionGateReducer,
  type EncryptionGateState,
} from '../encryption-gate-reducer';

const activeDek = new Uint8Array(32).fill(1);
const mek = new Uint8Array(32).fill(2);
const dekEntry: DekEntry = {
  key: activeDek,
  createdAt: 1737000000000,
  retiredAt: null,
};

function state(
  overrides: Partial<EncryptionGateState> = {},
): EncryptionGateState {
  return {
    userId: 'user-1',
    session: { status: 'checking', hasProfile: false },
    mek: null,
    activeDek: null,
    activeDekId: null,
    keyRingId: null,
    keyRingRevision: null,
    deks: null,
    ...overrides,
  };
}

describe('encryptionGateReducer', () => {
  it('moves to locked after finding an existing key', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-succeeded' }),
    ).toMatchObject({
      session: { status: 'locked', hasProfile: true },
      activeDek: null,
    });
  });

  it('moves to setup after confirming the key is missing', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-missing' }),
    ).toMatchObject({
      session: { status: 'uninitialized', hasProfile: false },
      activeDek: null,
    });
  });

  it('keeps users out of setup when the key check fails', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-failed' }),
    ).toMatchObject({
      session: { status: 'error', hasProfile: false, error: 'check' },
      activeDek: null,
    });
  });

  it('retries the key check from a check error', () => {
    const previous = state({
      session: { status: 'error', hasProfile: false, error: 'check' },
    });

    expect(
      encryptionGateReducer(previous, { type: 'retry-check' }),
    ).toMatchObject({
      session: { status: 'checking', hasProfile: false },
      activeDek: null,
    });
  });

  it('tracks setup submission and failure', () => {
    const submitting = encryptionGateReducer(state(), {
      type: 'setup-submitted',
    });

    expect(submitting).toMatchObject({
      session: { status: 'setup-submitting', hasProfile: false },
    });
    expect(
      encryptionGateReducer(submitting, { type: 'setup-failed' }),
    ).toMatchObject({
      session: { status: 'error', hasProfile: false, error: 'setup' },
    });
  });

  it('tracks unlock submission and failure', () => {
    const previous = state({ session: { status: 'locked', hasProfile: true } });
    const submitting = encryptionGateReducer(previous, {
      type: 'unlock-submitted',
    });

    expect(submitting).toMatchObject({
      session: { status: 'unlock-submitting', hasProfile: true },
    });
    expect(
      encryptionGateReducer(submitting, { type: 'unlock-failed' }),
    ).toMatchObject({
      session: { status: 'error', hasProfile: true, error: 'unlock' },
    });
  });

  it('stores the active dek only after unlock succeeds', () => {
    expect(
      encryptionGateReducer(state(), {
        type: 'unlocked',
        mek,
        activeDek,
        activeDekId: 'key-1',
        keyRingId: 'ring-1',
        keyRingRevision: 1,
        deks: { 'key-1': dekEntry },
      }),
    ).toEqual({
      userId: 'user-1',
      session: { status: 'unlocked', hasProfile: true },
      mek,
      activeDek,
      activeDekId: 'key-1',
      keyRingId: 'ring-1',
      keyRingRevision: 1,
      deks: { 'key-1': dekEntry },
    });
  });

  it('clears in-memory key material without signing out', () => {
    expect(
      encryptionGateReducer(
        state({
          session: { status: 'unlocked', hasProfile: true },
          mek,
          activeDek,
          activeDekId: 'key-1',
          keyRingId: 'ring-1',
          keyRingRevision: 1,
          deks: { 'key-1': dekEntry },
        }),
        { type: 'clear-session' },
      ),
    ).toEqual({
      userId: 'user-1',
      session: { status: 'locked', hasProfile: true },
      mek: null,
      activeDek: null,
      activeDekId: null,
      keyRingId: null,
      keyRingRevision: null,
      deks: null,
    });
  });
});
