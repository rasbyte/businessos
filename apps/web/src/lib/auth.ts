import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { fetchMe } from './api';
import { readAccessToken } from './session';

/** The signed-in user, or null. Asks the API on every request, so a revoked session stops working. */
export const getCurrentUser = cache(async () => {
  const token = await readAccessToken();
  if (!token) return null;

  const result = await fetchMe(token);
  if (result.kind === 'ok') return result.user;
  if (result.kind === 'unauthorized') redirect('/signout');
  throw new Error('The API is not reachable.');
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** The signed-in user together with the organization they work in. Redirects when they have none. */
export async function requireOrgAccess() {
  const user = await requireUser();
  const membership = user.memberships.find((item) => item.organization.status === 'ACTIVE');
  if (!membership) {
    redirect('/no-access');
  }
  return {
    user,
    org: membership.organization,
    role: membership.role,
    permissions: membership.permissions,
  };
}
