import 'server-only';
import { cookies, headers } from 'next/headers';
import type { AuthResponse } from '@businessos/contracts';
import type { ClientInfo } from './api';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from './cookies';

export async function setSessionCookies(auth: AuthResponse): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, auth.accessToken, accessCookieOptions(auth.expiresIn));
  store.set(REFRESH_COOKIE, auth.refreshToken, refreshCookieOptions);
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

/** The visitor's address and browser, as forwarded to the API for its rate limits. */
export async function readClientInfo(): Promise<ClientInfo> {
  const incoming = await headers();
  return {
    ip: incoming.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
    userAgent: incoming.get('user-agent') ?? undefined,
  };
}
