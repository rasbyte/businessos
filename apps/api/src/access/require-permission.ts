import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@businessos/contracts';

export const REQUIRED_PERMISSION = 'required_permission';

/** Managers need this permission on the route. Owners always pass. */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);
