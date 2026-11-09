import { describe, expect, it } from 'vitest';
import { formatTaka } from './money';

describe('formatTaka', () => {
  it('shows whole taka in English with lakh grouping', () => {
    expect(formatTaka(1_850_000, 'en')).toBe('৳ 18,500');
    expect(formatTaka(185_000_000, 'en')).toBe('৳ 18,50,000');
  });

  it('shows Bangla digits in Bangla', () => {
    expect(formatTaka(1_850_000, 'bn')).toBe('৳ ১৮,৫০০');
  });
});
