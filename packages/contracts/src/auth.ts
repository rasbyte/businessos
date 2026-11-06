import { z } from 'zod';
import { phoneSchema, toAsciiDigits } from './phone.js';

const codeSchema = z
  .string()
  .max(16)
  .transform((value) => toAsciiDigits(value).replace(/\s/g, ''))
  .pipe(z.string().regex(/^[0-9]{6}$/, 'Code must be 6 digits'));

export const requestCodeSchema = z.object({ phone: phoneSchema });
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;

export const verifyCodeSchema = z.object({ phone: phoneSchema, code: codeSchema });
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const refreshTokenSchema = z.object({ refreshToken: z.string().min(20).max(200) });
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
