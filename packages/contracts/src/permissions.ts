import { z } from 'zod';

/** Everything a manager can be allowed to do. Owners can always do everything. */
export const PERMISSIONS = ['units.read', 'units.write'] as const;

export type Permission = (typeof PERMISSIONS)[number];
export const permissionSchema = z.enum(PERMISSIONS);

/** Owners can do everything. Managers need the permission in their list. */
export function hasPermission(
  role: 'OWNER' | 'MANAGER',
  granted: readonly string[],
  permission: Permission,
): boolean {
  return role === 'OWNER' || granted.includes(permission);
}
