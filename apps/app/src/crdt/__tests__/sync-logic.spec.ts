import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

import {
  applyRecordsToDoc,
  computeDelta,
  decryptSyncPayload,
  encryptSyncPayload,
  hasPendingChanges,
  REMOTE_ORIGIN,
  schedulePushIfPendingChanges,
} from '../sync-logic';
import type { ParsedSyncState } from '../sync-state';

function makeState(overrides: Partial<ParsedSyncState> = {}): ParsedSyncState {
  return {
    cursor: 0,
    stateVector: null,
    dirty: false,
    lastSuccessfulSyncAt: null,
    ...overrides,
  };
}

describe('hasPendingChanges', () => {
  it('returns true when stateVector is null', () => {
    expect(
      hasPendingChanges(makeState({ stateVector: null, dirty: false })),
    ).toBe(true);
  });

  it('returns true when stateVector is null and dirty is true', () => {
    expect(
      hasPendingChanges(makeState({ stateVector: null, dirty: true })),
    ).toBe(true);
  });

  it('returns true when dirty is true with a stateVector', () => {
    expect(
      hasPendingChanges(
        makeState({ stateVector: new Uint8Array(0), dirty: true }),
      ),
    ).toBe(true);
  });

  it('returns false when dirty is false with a stateVector', () => {
    expect(
      hasPendingChanges(
        makeState({ stateVector: new Uint8Array(0), dirty: false }),
      ),
    ).toBe(false);
  });
});

describe('computeDelta', () => {
  it('returns full document state when stateVector is null', () => {
    const doc = new Y.Doc();
    doc.getMap('root').set('key', 'value');

    const delta = computeDelta(doc as never, null);

    const copy = new Y.Doc();
    Y.applyUpdate(copy, delta);
    expect(copy.getMap('root').get('key')).toBe('value');
  });

  it('returns incremental delta when stateVector is provided', () => {
    const doc = new Y.Doc();
    doc.getMap('root').set('a', 1);
    const sv = Y.encodeStateVector(doc);

    doc.getMap('root').set('b', 2);
    const delta = computeDelta(doc as never, sv);

    const copy = new Y.Doc();
    Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
    Y.applyUpdate(copy, delta);

    expect(copy.getMap('root').get('a')).toBe(1);
    expect(copy.getMap('root').get('b')).toBe(2);
  });

  it('returns a delta that adds no new data when nothing changed', () => {
    const doc = new Y.Doc();
    doc.getMap('root').set('x', 10);
    const sv = Y.encodeStateVector(doc);

    const delta = computeDelta(doc as never, sv);

    const copy = new Y.Doc();
    Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
    const before = copy.getMap('root').get('x');
    Y.applyUpdate(copy, delta);
    expect(copy.getMap('root').get('x')).toBe(before);
  });
});

describe('applyRecordsToDoc', () => {
  it('applies a single plaintext to the document', () => {
    const source = new Y.Doc();
    source.getMap('data').set('name', 'test');
    const plaintext = Y.encodeStateAsUpdate(source);

    const target = new Y.Doc();
    applyRecordsToDoc(target as never, [plaintext]);

    expect(target.getMap('data').get('name')).toBe('test');
  });

  it('applies multiple plaintexts in order within one transaction', () => {
    const doc1 = new Y.Doc();
    doc1.getMap('root').set('a', 1);
    const bytes1 = Y.encodeStateAsUpdate(doc1);

    const doc2 = new Y.Doc();
    doc2.getMap('root').set('b', 2);
    const bytes2 = Y.encodeStateAsUpdate(doc2);

    const target = new Y.Doc();
    applyRecordsToDoc(target as never, [bytes1, bytes2]);

    expect(target.getMap('root').get('a')).toBe(1);
    expect(target.getMap('root').get('b')).toBe(2);
  });

  it('does nothing for empty array', () => {
    const doc = new Y.Doc();
    doc.getMap('root').set('existing', true);
    const before = Y.encodeStateAsUpdate(doc);

    applyRecordsToDoc(doc as never, []);

    expect(Y.encodeStateAsUpdate(doc)).toEqual(before);
  });

  it('marks updates with REMOTE_ORIGIN', () => {
    const source = new Y.Doc();
    source.getMap('root').set('k', 'v');
    const bytes = Y.encodeStateAsUpdate(source);

    const origins: unknown[] = [];
    const target = new Y.Doc();
    target.on('update', (_update: Uint8Array, origin: unknown) => {
      origins.push(origin);
    });

    applyRecordsToDoc(target as never, [bytes]);

    expect(origins).toEqual([REMOTE_ORIGIN]);
  });
});

describe('schedulePushIfPendingChanges', () => {
  it('calls schedulePush when there are pending changes', () => {
    const fn = vi.fn();
    schedulePushIfPendingChanges(
      makeState({ stateVector: null, dirty: false }),
      fn,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls schedulePush when dirty is true', () => {
    const fn = vi.fn();
    schedulePushIfPendingChanges(
      makeState({ stateVector: new Uint8Array(0), dirty: true }),
      fn,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not call schedulePush when no pending changes', () => {
    const fn = vi.fn();
    schedulePushIfPendingChanges(
      makeState({ stateVector: new Uint8Array(0), dirty: false }),
      fn,
    );
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('encryptSyncPayload / decryptSyncPayload', () => {
  const masterKey = crypto.getRandomValues(new Uint8Array(32));
  const userId = 'user-abc';
  const keyId = 'key-xyz';

  it('roundtrip: encrypt then decrypt returns original plaintext', async () => {
    const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'update',
    );
    const decrypted = await decryptSyncPayload(
      encrypted,
      masterKey,
      userId,
      keyId,
      'update',
    );
    expect(decrypted).toEqual(plaintext);
  });

  it('returns aes-256-gcm, encryptionVersion=1, 12-byte IV, and ciphertext of correct length', async () => {
    const plaintext = new Uint8Array([10, 20, 30]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'update',
    );
    expect(encrypted.encryptionAlgorithm).toBe('aes-256-gcm');
    expect(encrypted.encryptionVersion).toBe(1);
    expect(encrypted.iv.byteLength).toBe(12);
    expect(encrypted.ciphertext.byteLength).toBe(plaintext.byteLength + 16); // plaintext + GCM tag
  });

  it('decryption fails when AAD userId differs', async () => {
    const plaintext = new Uint8Array([1, 2]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'update',
    );
    await expect(
      decryptSyncPayload(encrypted, masterKey, 'other-user', keyId, 'update'),
    ).rejects.toThrow();
  });

  it('decryption fails when AAD kind differs', async () => {
    const plaintext = new Uint8Array([1, 2]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'update',
    );
    await expect(
      decryptSyncPayload(encrypted, masterKey, userId, keyId, 'snapshot'),
    ).rejects.toThrow();
  });

  it('decryption fails when AAD keyId differs', async () => {
    const plaintext = new Uint8Array([1, 2]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'update',
    );
    await expect(
      decryptSyncPayload(encrypted, masterKey, userId, 'other-key', 'update'),
    ).rejects.toThrow();
  });

  it('snapshot roundtrip works correctly', async () => {
    const plaintext = new Uint8Array([0xaa, 0xbb, 0xcc]);
    const encrypted = await encryptSyncPayload(
      plaintext,
      masterKey,
      userId,
      keyId,
      'snapshot',
    );
    const decrypted = await decryptSyncPayload(
      encrypted,
      masterKey,
      userId,
      keyId,
      'snapshot',
    );
    expect(decrypted).toEqual(plaintext);
  });

  it('throws on unknown encryption_algorithm', async () => {
    await expect(
      decryptSyncPayload(
        {
          encryptionAlgorithm: 'ChaCha20-Poly1305' as 'aes-256-gcm',
          encryptionVersion: 1,
          iv: new Uint8Array(12),
          ciphertext: new Uint8Array(16),
        },
        masterKey,
        userId,
        keyId,
        'update',
      ),
    ).rejects.toThrow('Unsupported encryption_algorithm');
  });

  it('throws on unknown encryption_version', async () => {
    await expect(
      decryptSyncPayload(
        {
          encryptionAlgorithm: 'aes-256-gcm',
          encryptionVersion: 99 as 1,
          iv: new Uint8Array(12),
          ciphertext: new Uint8Array(16),
        },
        masterKey,
        userId,
        keyId,
        'update',
      ),
    ).rejects.toThrow('Unsupported encryption_version');
  });
});
