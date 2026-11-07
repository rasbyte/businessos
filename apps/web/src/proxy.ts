import { NextResponse, type NextRequest } from 'next/server';
import type { AuthResponse } from '@businessos/contracts';
import { refreshSession } from '@/lib/api';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from '@/lib/cookies';
import { accessDecision } from '@/lib/route-access';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccess = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const isPrefetch =
    request.headers.has('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';

  let decision = accessDecision({
    pathname,
    hasAccess,
    hasRefresh: Boolean(refreshToken),
    isPrefetch,
  });

  let renewed: AuthResponse | null = null;
  if (decision === 'try-refresh' && refreshToken) {
    renewed = await refreshSession(refreshToken, {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });
    decision = accessDecision({
      pathname,
      hasAccess: renewed !== null,
      hasRefresh: false,
      isPrefetch,
    });
  }

  if (renewed) {
    // Let this very request see the new cookies too.
    request.cookies.set(ACCESS_COOKIE, renewed.accessToken);
    request.cookies.set(REFRESH_COOKIE, renewed.refreshToken);
  }

  const response =
    decision === 'to-login'
      ? NextResponse.redirect(new URL('/login', request.url))
      : decision === 'to-home'
        ? NextResponse.redirect(new URL('/', request.url))
        : NextResponse.next({ request });

  if (renewed) {
    response.cookies.set(
      ACCESS_COOKIE,
      renewed.accessToken,
      accessCookieOptions(renewed.expiresIn),
    );
    response.cookies.set(REFRESH_COOKIE, renewed.refreshToken, refreshCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
