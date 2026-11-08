import { z } from 'zod';

/** Everything a manager can be allowed to do. Owners can always do everything. */
export const PERMISSIONS = ['units.read', 'units.write'] as const;

export type Permission = (typeof PERMISSIONS)[number];
export const permissionSchema = z.enum(PERMISSIONS);
