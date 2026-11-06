import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone.js';

describe('normalizePhone', () => {
  it.each([
    ['01712345678', '+8801712345678'],
    ['+8801712345678', '+8801712345678'],
    ['8801712345678', '+8801712345678'],
    ['008801712345678', '+8801712345678'],
    ['017 1234-5678', '+8801712345678'],
    ['০১৭১২৩৪৫৬৭৮', '+8801712345678'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', '123', '0121234567', '01212345678', '+12', 'abc'])('rejects "%s"', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});
