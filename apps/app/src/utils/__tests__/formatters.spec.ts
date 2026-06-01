import { describe, expect, it } from 'vitest';

import { formatCurrency, formatDateLong } from '../formatters';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00');
  });

  it('formats with dot thousands separator and comma decimal', () => {
    expect(formatCurrency(4200000)).toBe('4.200.000,00');
  });
});

describe('formatDateLong', () => {
  it('formats a known date with day, abbreviated month, and year', () => {
    const result = formatDateLong(new Date('2023-04-12'));
    expect(result).toContain('12');
    expect(result.toLowerCase()).toContain('apr');
    expect(result).toContain('2023');
  });

  it('formats a date in January', () => {
    const result = formatDateLong(new Date('2024-01-15'));
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});
