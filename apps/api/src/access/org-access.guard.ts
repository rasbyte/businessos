import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@businessos/contracts';
import { asUuid } from '../common/uuid.js';
import { DatabaseService } from '../database/database.service.js';
import { type OrgRequest } from './org-context.js';
import { REQUIRED_PERMISSION } from './require-permission.js';

/**
 * Use after AuthGuard on routes like /orgs/:orgId/... It lets in only active members of that
 * organization. Everyone else gets 404, so the organization's existence is not revealed.
 */
@Injectable()
export class OrgAccessGuard implements CanActivate {
  constructor(
    private readonly database: DatabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrgRequest>();
    const rawId = request.params['orgId'];
    const organizationId = asUuid(typeof rawId === 'string' ? rawId : undefined);
    if (!request.auth) {
      throw new NotFoundException();
    }

    const membership = await this.database.client.membership.findUnique({
      where: { userId_organizationId: { userId: request.auth.userId, organizationId } },
      include: { organization: { select: { status: true } } },
    });
    if (!membership?.isActive || membership.organization.status !== 'ACTIVE') {
      throw new NotFoundException();
    }

    const required = this.reflector.getAllAndOverride<Permission | undefined>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required && membership.role !== 'OWNER' && !membership.permissions.includes(required)) {
      throw new ForbiddenException();
    }

    request.org = {
      organizationId,
      businessId: membership.businessId,
      role: membership.role,
      permissions: membership.permissions,
    };
    return true;
  }
}
