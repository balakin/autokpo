import { describe, expect, it } from 'vitest';

import { convertToRsd } from '../convert-to-rsd';

describe('convertToRsd', () => {
  describe('basic conversion with parity=1 (most currencies)', () => {
    it('converts a whole amount at EUR rate', () => {
      expect(convertToRsd(100, 117.5, 1)).toBe(11750);
    });

    it('converts a decimal amount at EUR rate', () => {
      // 50.5 * 117.5 = 5933.75 → kept as-is (already 2dp)
      expect(convertToRsd(50.5, 117.5, 1)).toBe(5933.75);
    });

    it('preserves up to 2 decimal places for 1 unit', () => {
      // 1 * 117.5 = 117.5
      expect(convertToRsd(1, 117.5, 1)).toBe(117.5);
    });
  });

  describe('conversion with parity > 1 (e.g. JPY)', () => {
    it('converts JPY with parity=100', () => {
      // 1000 * 74 / 100 = 740
      expect(convertToRsd(1000, 74, 100)).toBe(740);
    });

    it('converts a small JPY amount', () => {
      // 50 * 74 / 100 = 37
      expect(convertToRsd(50, 74, 100)).toBe(37);
    });

    it('converts with parity=1000', () => {
      // 5000 * 0.12 / 1000 = 0.6
      expect(convertToRsd(5000, 0.12, 1000)).toBe(0.6);
    });
  });

  describe('2-decimal-place rounding', () => {
    it('preserves an exact 1-decimal result', () => {
      // 1 * 0.5 / 1 = 0.5
      expect(convertToRsd(1, 0.5, 1)).toBe(0.5);
    });

    it('preserves an exact 1-decimal result (1.5)', () => {
      expect(convertToRsd(1, 1.5, 1)).toBe(1.5);
    });

    it('preserves a 2-decimal result (2.49)', () => {
      expect(convertToRsd(1, 2.49, 1)).toBe(2.49);
    });

    it('preserves a 2-decimal result (2.51)', () => {
      expect(convertToRsd(1, 2.51, 1)).toBe(2.51);
    });

    it('preserves a 1-decimal result below 0.5', () => {
      // 1 * 0.4 / 1 = 0.4
      expect(convertToRsd(1, 0.4, 1)).toBe(0.4);
    });

    it('rounds the third decimal place for a non-trivial result', () => {
      // 33.33 * 117.5 in IEEE 754 = 3916.2749999... → round to 2dp → 3916.27
      expect(convertToRsd(33.33, 117.5, 1)).toBe(3916.27);
    });

    it('preserves exact 2-decimal results', () => {
      // 1 * 1.25 / 1 = 1.25
      expect(convertToRsd(1, 1.25, 1)).toBe(1.25);
      // 1 * 1.75 / 1 = 1.75
      expect(convertToRsd(1, 1.75, 1)).toBe(1.75);
    });
  });

  describe('zero and small amounts', () => {
    it('returns 0 for zero amount', () => {
      expect(convertToRsd(0, 117.5, 1)).toBe(0);
    });

    it('handles very small amount', () => {
      // 0.01 * 117.5 = 1.175 → round to 2dp → 1.18
      expect(convertToRsd(0.01, 117.5, 1)).toBe(1.18);
    });

    it('returns a small 2-decimal result for a tiny amount', () => {
      // 0.001 * 117.5 = 0.1175 → round to 2dp → 0.12
      expect(convertToRsd(0.001, 117.5, 1)).toBe(0.12);
    });
  });

  describe('large amounts', () => {
    it('converts a large foreign amount', () => {
      // 10000 EUR at 117.5 → 1,175,000 RSD
      expect(convertToRsd(10000, 117.5, 1)).toBe(1175000);
    });

    it('handles very large exchange rate', () => {
      expect(convertToRsd(1, 100000, 1)).toBe(100000);
    });
  });

  describe('floating point precision', () => {
    it('handles 0.1 + 0.2 style precision issues in amount', () => {
      // 0.30000000000000004 * 100 = 30.000...004 → rounds to 30
      const amount = 0.1 + 0.2;
      expect(convertToRsd(amount, 100, 1)).toBe(30);
    });

    it('handles repeating decimal in exchange rate', () => {
      // 100 * (1/3) = 33.333... → round to 2dp → 33.33
      expect(convertToRsd(100, 1 / 3, 1)).toBe(33.33);
    });

    it('handles division that produces floating point remainder', () => {
      // 100 * (1/7) = 14.2857... → round to 2dp → 14.29
      expect(convertToRsd(100, 1 / 7, 1)).toBe(14.29);
    });

    it('handles combined multiplication and division with parity', () => {
      // 123.45 * 117.504 / 100 = 145.0569... → round to 2dp → 145.06
      expect(convertToRsd(123.45, 117.504, 100)).toBe(145.06);
    });
  });

  describe('real-world scenarios from NBS rates', () => {
    it('converts EUR to RSD (parity=1)', () => {
      expect(convertToRsd(250, 117.5, 1)).toBe(29375);
    });

    it('converts USD to RSD (parity=1)', () => {
      expect(convertToRsd(100, 107.0, 1)).toBe(10700);
    });

    it('converts JPY to RSD (parity=100)', () => {
      // 5000 * 74.0 / 100 = 3700
      expect(convertToRsd(5000, 74.0, 100)).toBe(3700);
    });

    it('converts HUF to RSD (parity=100)', () => {
      // 20000 * 0.27 / 100 = 54
      expect(convertToRsd(20000, 0.27, 100)).toBe(54);
    });
  });

  describe('negative amounts (defensive)', () => {
    it('converts a negative amount', () => {
      expect(convertToRsd(-100, 117.5, 1)).toBe(-11750);
    });

    it('rounds negative result to 2 decimal places', () => {
      // -1 * 1.5 = -1.5 → preserved as-is
      expect(convertToRsd(-1, 1.5, 1)).toBe(-1.5);
    });
  });
});
