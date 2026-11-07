export type AccessDecision = 'continue' | 'to-login' | 'to-home' | 'try-refresh';

interface AccessInput {
  pathname: string;
  hasAccess: boolean;
  hasRefresh: boolean;
  isPrefetch: boolean;
}

/** The quick, cookie-only check done in the proxy. Real checks happen in the pages. */
export function accessDecision({
  pathname,
  hasAccess,
  hasRefresh,
  isPrefetch,
}: AccessInput): AccessDecision {
  if (pathname === '/signout') {
    return 'continue';
  }
  const onLogin = pathname === '/login';
  if (hasAccess) {
    return onLogin ? 'to-home' : 'continue';
  }
  if (hasRefresh && !isPrefetch) {
    return 'try-refresh';
  }
  return onLogin ? 'continue' : 'to-login';
}
