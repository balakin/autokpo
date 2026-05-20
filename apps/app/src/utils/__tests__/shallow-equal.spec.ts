import { describe, expect, it } from 'vitest';

import { shallowEqual } from '../shallow-equal';

describe('shallowEqual', () => {
  it('returns true for identical primitives', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual('a', 'a')).toBe(true);
    expect(shallowEqual(null, null)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual('a', 'b')).toBe(false);
    expect(shallowEqual(null, 'a')).toBe(false);
  });

  it('compares arrays shallowly', () => {
    expect(shallowEqual([1, 'a'], [1, 'a'])).toBe(true);
    expect(shallowEqual([1, 'a'], [1, 'b'])).toBe(false);
    expect(shallowEqual([1], [1, 2])).toBe(false);
  });

  it('compares objects shallowly', () => {
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 2, b: 'x' })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('does not deep-compare nested references', () => {
    expect(shallowEqual({ nested: { a: 1 } }, { nested: { a: 1 } })).toBe(
      false,
    );

    const nested = { a: 1 };
    expect(shallowEqual({ nested }, { nested })).toBe(true);
  });
});
