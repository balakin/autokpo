import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { bootstrap, createRuntime } from '../doc';
import type { TypedDoc } from '../typed-doc';

function makeDoc(): TypedDoc {
  return new Y.Doc() as unknown as TypedDoc;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('bootstrap — schemaVersion', () => {
  it('seeds schemaVersion when absent', () => {
    const doc = makeDoc();
    bootstrap(doc, 'en');
    expect(doc.getMap('meta').get('schemaVersion')).toBe(1);
  });

  it('does not overwrite existing schemaVersion', () => {
    const doc = makeDoc();
    doc.transact(() => doc.getMap('meta').set('schemaVersion', 99));
    bootstrap(doc, 'en');
    expect(doc.getMap('meta').get('schemaVersion')).toBe(99);
  });

  it('seeds createdAt when absent', () => {
    const doc = makeDoc();
    bootstrap(doc, 'en');
    expect(doc.getMap('meta').get('createdAt')).toEqual(expect.any(String));
  });

  it('does not overwrite existing createdAt', () => {
    const doc = makeDoc();
    doc.transact(() => doc.getMap('meta').set('createdAt', 'existing'));
    bootstrap(doc, 'en');
    expect(doc.getMap('meta').get('createdAt')).toBe('existing');
  });
});

describe('bootstrap — locale seeding', () => {
  it('seeds locale with initialLocale when user.locale is absent', () => {
    const doc = makeDoc();
    bootstrap(doc, 'en');
    expect(doc.getMap('user').get('locale')).toBe('en');
  });

  it('seeds sr-Latn when initialLocale is sr-Latn', () => {
    const doc = makeDoc();
    bootstrap(doc, 'sr-Latn');
    expect(doc.getMap('user').get('locale')).toBe('sr-Latn');
  });

  it('seeds ru when initialLocale is ru', () => {
    const doc = makeDoc();
    bootstrap(doc, 'ru');
    expect(doc.getMap('user').get('locale')).toBe('ru');
  });

  it('does not overwrite existing user.locale', () => {
    const doc = makeDoc();
    doc.transact(() => doc.getMap('user').set('locale', 'ru'));
    bootstrap(doc, 'en');
    expect(doc.getMap('user').get('locale')).toBe('ru');
  });
});

describe('createRuntime', () => {
  it('drains queued persistence writes before destroying the Y.Doc', async () => {
    const userId = `runtime-destroy:${crypto.randomUUID()}`;
    const runtime = createRuntime(userId, {
      mek: new Uint8Array(32).fill(9),
    });
    await runtime.whenReady;

    for (let i = 0; i < 500; i += 1) {
      let update: Uint8Array | null = null;
      runtime.ydoc.once('update', (bytes: Uint8Array) => {
        update = bytes;
      });
      runtime.ydoc.getMap('meta').set('serverCursor', i);
      await runtime.persistence.persistLocalUpdate(update!);
    }
    await runtime.destroy();

    const nextRuntime = createRuntime(userId, {
      mek: new Uint8Array(32).fill(9),
    });
    await nextRuntime.whenReady;

    expect(nextRuntime.ydoc.getMap('meta').get('serverCursor')).toBe(499);
    await nextRuntime.destroy();
  });
});
