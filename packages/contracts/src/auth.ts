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

export const authUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  name: z.string().nullable(),
  language: z.enum(['BN', 'EN']),
  platformRole: z.enum(['DEVELOPER', 'PLATFORM_ADMIN']).nullable(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const meResponseSchema = authUserSchema.extend({
  memberships: z.array(
    z.object({
      role: z.enum(['OWNER', 'MANAGER']),
      permissions: z.array(z.string()),
      organization: z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['INTERNAL', 'CUSTOMER']),
        status: z.enum(['ACTIVE', 'SUSPENDED']),
      }),
    }),
  ),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
