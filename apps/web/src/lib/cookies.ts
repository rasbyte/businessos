export const ACCESS_COOKIE = 'bos_at';
export const REFRESH_COOKIE = 'bos_rt';

const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const base = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

/** The cookie expires a minute before the token, so the proxy renews it in time. */
export function accessCookieOptions(expiresInSeconds: number) {
  return { ...base, maxAge: Math.max(expiresInSeconds - 60, 60) };
}

export const refreshCookieOptions = { ...base, maxAge: REFRESH_MAX_AGE_SECONDS };
