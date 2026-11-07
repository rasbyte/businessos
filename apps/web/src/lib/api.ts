// Calls from the web server to the BusinessOS API. Never import this in a client component.
import {
  authResponseSchema,
  meResponseSchema,
  type AuthResponse,
  type MeResponse,
} from '@businessos/contracts';
import { env } from './env';

export interface ClientInfo {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

async function call(
  method: 'GET' | 'POST',
  path: string,
  options: { body?: unknown; token?: string; client?: ClientInfo } = {},
): Promise<Response | null> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.token) headers['authorization'] = `Bearer ${options.token}`;
  if (options.client?.ip) headers['x-forwarded-for'] = options.client.ip;
  if (options.client?.userAgent) headers['user-agent'] = options.client.userAgent;

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  try {
    return await fetch(`${env.API_URL}/api/auth/${path}`, init);
  } catch {
    return null;
  }
}

export type RequestCodeResult = 'sent' | 'rate_limited' | 'error';

export async function requestCode(phone: string, client: ClientInfo): Promise<RequestCodeResult> {
  const response = await call('POST', 'request-code', { body: { phone }, client });
  if (response?.status === 202) return 'sent';
  if (response?.status === 429) return 'rate_limited';
  return 'error';
}

export type VerifyCodeResult =
  { kind: 'ok'; auth: AuthResponse } | { kind: 'invalid' } | { kind: 'error' };

export async function verifyCode(
  phone: string,
  code: string,
  client: ClientInfo,
): Promise<VerifyCodeResult> {
  const response = await call('POST', 'verify-code', { body: { phone, code }, client });
  if (!response) return { kind: 'error' };
  if (response.status === 401 || response.status === 429) return { kind: 'invalid' };
  if (response.status !== 200) return { kind: 'error' };
  const parsed = authResponseSchema.safeParse(await response.json());
  return parsed.success ? { kind: 'ok', auth: parsed.data } : { kind: 'error' };
}

/** Swaps a refresh token for a new pair, or returns null when it is no longer accepted. */
export async function refreshSession(
  refreshToken: string,
  client: ClientInfo,
): Promise<AuthResponse | null> {
  const response = await call('POST', 'refresh', { body: { refreshToken }, client });
  if (response?.status !== 200) return null;
  const parsed = authResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

export type MeResult =
  { kind: 'ok'; user: MeResponse } | { kind: 'unauthorized' } | { kind: 'error' };

export async function fetchMe(accessToken: string): Promise<MeResult> {
  const response = await call('GET', 'me', { token: accessToken });
  if (!response) return { kind: 'error' };
  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status !== 200) return { kind: 'error' };
  const parsed = meResponseSchema.safeParse(await response.json());
  return parsed.success ? { kind: 'ok', user: parsed.data } : { kind: 'error' };
}

export async function logoutRemote(accessToken: string): Promise<void> {
  await call('POST', 'logout', { token: accessToken });
}
