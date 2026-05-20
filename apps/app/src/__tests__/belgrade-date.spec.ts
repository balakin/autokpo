import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { belgradeToday } from '../belgrade-date';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('belgradeToday', () => {
  it('returns date in YYYY-MM-DD format via toString()', () => {
    vi.setSystemTime(new Date('2025-04-25T10:00:00Z'));
    expect(belgradeToday().toString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a CalendarDate matching the Belgrade calendar date', () => {
    vi.setSystemTime(new Date('2025-04-25T10:00:00Z'));
    const result = belgradeToday();
    expect(result.toString()).toBe('2025-04-25');
  });

  it('uses Belgrade timezone for day boundary (winter)', () => {
    // UTC 23:30 → Belgrade CET 00:30 next day
    vi.setSystemTime(new Date('2025-01-15T23:30:00Z'));
    const result = belgradeToday();
    expect(result.toString()).toBe('2025-01-16');
  });
});
