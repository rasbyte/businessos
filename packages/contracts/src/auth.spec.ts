import { describe, expect, it } from 'vitest';
import { verifyCodeSchema } from './auth.js';

describe('verifyCodeSchema', () => {
  it('normalizes the phone and accepts ascii or bangla digits', () => {
    expect(verifyCodeSchema.parse({ phone: '01712345678', code: '123456' })).toEqual({
      phone: '+8801712345678',
      code: '123456',
    });
    expect(verifyCodeSchema.parse({ phone: '01712345678', code: '১২৩৪৫৬' }).code).toBe('123456');
  });

  it('rejects codes that are not 6 digits', () => {
    expect(verifyCodeSchema.safeParse({ phone: '01712345678', code: '12345' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ phone: '01712345678', code: 'abcdef' }).success).toBe(
      false,
    );
  });
});
