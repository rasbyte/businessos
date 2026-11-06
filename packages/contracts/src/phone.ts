import { z } from 'zod';

const E164 = /^\+[1-9][0-9]{7,14}$/;
const BD_LOCAL = /^01[3-9][0-9]{8}$/;
const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

/**
 * Turns what a person typed into international format (+8801XXXXXXXXX).
 * Returns null when the value is not a valid phone number.
 */
export function normalizePhone(input: string): string | null {
  const cleaned = toAsciiDigits(input).replace(/[\s().-]/g, '');
  if (cleaned.startsWith('+')) {
    return E164.test(cleaned) ? cleaned : null;
  }
  const digits = cleaned.replace(/^00/, '');
  const local = digits.startsWith('880') ? `0${digits.slice(3)}` : digits;
  return BD_LOCAL.test(local) ? `+88${local}` : null;
}

export const phoneSchema = z
  .string()
  .max(32)
  .transform((value, ctx) => {
    const phone = normalizePhone(value);
    if (phone === null) {
      ctx.addIssue({ code: 'custom', message: 'Invalid phone number' });
      return z.NEVER;
    }
    return phone;
  });
