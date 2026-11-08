import { createParamDecorator, NotFoundException, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-context.js';

/** Who the caller is inside one organization. Filled in by OrgAccessGuard. */
export interface OrgContext {
  organizationId: string;
  /** Set when the member is limited to one business. */
  businessId: string | null;
  role: 'OWNER' | 'MANAGER';
  permissions: string[];
}

export type OrgRequest = AuthenticatedRequest & { org?: OrgContext };

export const CurrentOrg = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const org = context.switchToHttp().getRequest<OrgRequest>().org;
  if (!org) {
    throw new NotFoundException();
  }
  return org;
});
