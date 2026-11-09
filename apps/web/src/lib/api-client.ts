import 'server-only';
import { redirect } from 'next/navigation';
import type { z } from 'zod';
import { env } from './env';
import { readAccessToken } from './session';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number };

/**
 * Calls the API as the signed-in user. A missing or rejected session sends the visitor to
 * /login or /signout. Other failures come back as { ok: false, status }, with status 0 when the
 * API cannot be reached.
 */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  init: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown } = {},
): Promise<ApiResult<z.infer<S>>> {
  const token = await readAccessToken();
  if (!token) {
    redirect('/login');
  }

  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const request: RequestInit = {
    method: init.method ?? 'GET',
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  };
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
    request.body = JSON.stringify(init.body);
  }

  let response: Response;
  try {
    response = await fetch(`${env.API_URL}/api${path}`, request);
  } catch {
    return { ok: false, status: 0 };
  }

  if (response.status === 401) {
    redirect('/signout');
  }
  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const parsed = schema.safeParse(await response.json());
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, status: 502 };
}
