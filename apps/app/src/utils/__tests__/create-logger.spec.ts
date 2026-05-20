import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '../create-logger';

describe('createLogger', () => {
  it('returns a callable logger function', () => {
    const log = createLogger('sync');
    expect(typeof log).toBe('function');
  });

  it('is a no-op in test mode', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const log = createLogger('sync');
    log('hello %s', 'world');

    expect(debugSpy).not.toHaveBeenCalled();
    debugSpy.mockRestore();
  });
});
