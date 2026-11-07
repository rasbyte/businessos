'use server';

import { redirect } from 'next/navigation';
import { requestCodeSchema, verifyCodeSchema } from '@businessos/contracts';
import { logoutRemote, requestCode, verifyCode } from '@/lib/api';
import {
  clearSessionCookies,
  readAccessToken,
  readClientInfo,
  setSessionCookies,
} from '@/lib/session';
import type { LoginState } from './login-state';

export async function requestCodeAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = requestCodeSchema.safeParse({ phone: formData.get('phone') });
  if (!parsed.success) {
    return { error: 'invalid_phone' };
  }

  const result = await requestCode(parsed.data.phone, await readClientInfo());
  if (result === 'rate_limited') return { error: 'too_many' };
  if (result === 'error') return { error: 'unavailable' };
  return { phone: parsed.data.phone };
}

export async function verifyCodeAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const phone = String(formData.get('phone') ?? '');
  const parsed = verifyCodeSchema.safeParse({ phone, code: formData.get('code') });
  if (!parsed.success) {
    return { phone, error: 'invalid_code' };
  }

  const result = await verifyCode(parsed.data.phone, parsed.data.code, await readClientInfo());
  if (result.kind === 'invalid') return { phone, error: 'invalid_code' };
  if (result.kind === 'error') return { phone, error: 'unavailable' };

  await setSessionCookies(result.auth);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  const token = await readAccessToken();
  if (token) {
    await logoutRemote(token);
  }
  await clearSessionCookies();
  redirect('/login');
}
