import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentOrg, type OrgContext } from '../access/org-context.js';
import { OrgAccessGuard } from '../access/org-access.guard.js';
import { RequirePermission } from '../access/require-permission.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { DatabaseService } from '../database/database.service.js';

@Controller('orgs/:orgId/properties')
@UseGuards(AuthGuard, OrgAccessGuard)
export class PropertiesController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @RequirePermission('units.read')
  async list(@CurrentOrg() org: OrgContext) {
    const rows = await this.database.client.property.findMany({
      where: {
        business: {
          organizationId: org.organizationId,
          ...(org.businessId ? { id: org.businessId } : {}),
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        business: { select: { id: true, name: true } },
      },
    });
    return rows.map(({ business, ...property }) => ({
      ...property,
      businessId: business.id,
      businessName: business.name,
    }));
  }
}
