import { describe, expect, it } from 'vitest';

import {
  encryptionGateReducer,
  type EncryptionGateState,
} from '../encryption-gate-reducer';

const masterKey = new Uint8Array(32).fill(1);

function state(
  overrides: Partial<EncryptionGateState> = {},
): EncryptionGateState {
  return {
    userId: 'user-1',
    session: { status: 'checking', hasProfile: false },
    masterKey: null,
    keyId: null,
    ...overrides,
  };
}

describe('encryptionGateReducer', () => {
  it('moves to locked after finding an existing key', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-succeeded' }),
    ).toMatchObject({
      session: { status: 'locked', hasProfile: true },
      masterKey: null,
    });
  });

  it('moves to setup after confirming the key is missing', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-missing' }),
    ).toMatchObject({
      session: { status: 'uninitialized', hasProfile: false },
      masterKey: null,
    });
  });

  it('keeps users out of setup when the key check fails', () => {
    expect(
      encryptionGateReducer(state(), { type: 'check-failed' }),
    ).toMatchObject({
      session: { status: 'error', hasProfile: false, error: 'check' },
      masterKey: null,
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
      masterKey: null,
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

  it('stores the master key and keyId only after unlock succeeds', () => {
    expect(
      encryptionGateReducer(state(), {
        type: 'unlocked',
        masterKey,
        keyId: 'key-1',
      }),
    ).toEqual({
      userId: 'user-1',
      session: { status: 'unlocked', hasProfile: true },
      masterKey,
      keyId: 'key-1',
    });
  });
});
