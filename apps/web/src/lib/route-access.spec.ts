import { describe, expect, it } from 'vitest';
import { accessDecision } from './route-access';

const signedOut = { hasAccess: false, hasRefresh: false, isPrefetch: false };

describe('accessDecision', () => {
  it('always lets /signout through', () => {
    expect(accessDecision({ ...signedOut, pathname: '/signout', hasAccess: true })).toBe(
      'continue',
    );
    expect(accessDecision({ ...signedOut, pathname: '/signout' })).toBe('continue');
  });

  it('sends a signed-in visitor away from /login and lets them see pages', () => {
    expect(accessDecision({ ...signedOut, pathname: '/login', hasAccess: true })).toBe('to-home');
    expect(accessDecision({ ...signedOut, pathname: '/', hasAccess: true })).toBe('continue');
  });

  it('asks for a refresh when only the refresh cookie is left', () => {
    expect(accessDecision({ ...signedOut, pathname: '/', hasRefresh: true })).toBe('try-refresh');
    expect(accessDecision({ ...signedOut, pathname: '/login', hasRefresh: true })).toBe(
      'try-refresh',
    );
  });

  it('does not refresh on background prefetches', () => {
    expect(
      accessDecision({ ...signedOut, pathname: '/', hasRefresh: true, isPrefetch: true }),
    ).toBe('to-login');
  });

  it('sends signed-out visitors to /login and leaves /login open', () => {
    expect(accessDecision({ ...signedOut, pathname: '/' })).toBe('to-login');
    expect(accessDecision({ ...signedOut, pathname: '/login' })).toBe('continue');
  });
});
