import { describe, expect, it } from 'vitest';

import { ANNUAL_LIMIT } from '../../constants';
import { thresholdColor } from '../threshold';

describe('thresholdColor', () => {
  const LIMIT = ANNUAL_LIMIT;

  it('returns success when value is well below limit (50%)', () => {
    expect(thresholdColor(LIMIT * 0.5, LIMIT)).toBe('success');
  });

  it('returns success when value is just below 90%', () => {
    expect(thresholdColor(LIMIT * 0.89, LIMIT)).toBe('success');
  });

  it('returns warning when value is exactly 90% of limit', () => {
    expect(thresholdColor(LIMIT * 0.9, LIMIT)).toBe('warning');
  });

  it('returns warning when value is 92% of limit', () => {
    expect(thresholdColor(LIMIT * 0.92, LIMIT)).toBe('warning');
  });

  it('returns warning when value equals limit exactly', () => {
    expect(thresholdColor(LIMIT, LIMIT)).toBe('warning');
  });

  it('returns danger when value exceeds limit (110%)', () => {
    expect(thresholdColor(LIMIT * 1.1, LIMIT)).toBe('danger');
  });

  it('returns danger when value is just above limit', () => {
    expect(thresholdColor(LIMIT + 1, LIMIT)).toBe('danger');
  });
});
