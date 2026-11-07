import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/cookies';

/** Clears the session cookies. Pages send visitors here when their session is no longer valid. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
