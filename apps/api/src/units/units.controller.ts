import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createUnitSchema,
  listUnitsQuerySchema,
  updateUnitSchema,
  type CreateUnitInput,
  type ListUnitsQuery,
  type UpdateUnitInput,
} from '@businessos/contracts';
import { CurrentOrg, type OrgContext } from '../access/org-context.js';
import { OrgAccessGuard } from '../access/org-access.guard.js';
import { RequirePermission } from '../access/require-permission.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { UnitsService } from './units.service.js';

@Controller('orgs/:orgId/units')
@UseGuards(AuthGuard, OrgAccessGuard)
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get()
  @RequirePermission('units.read')
  list(
    @CurrentOrg() org: OrgContext,
    @Query({ schema: listUnitsQuerySchema }) query: ListUnitsQuery,
  ) {
    return this.units.list(org, query);
  }

  @Get(':unitId')
  @RequirePermission('units.read')
  get(@CurrentOrg() org: OrgContext, @Param('unitId') unitId: string) {
    return this.units.get(org, unitId);
  }

  @Post()
  @RequirePermission('units.write')
  create(@CurrentOrg() org: OrgContext, @Body({ schema: createUnitSchema }) body: CreateUnitInput) {
    return this.units.create(org, body);
  }

  @Patch(':unitId')
  @RequirePermission('units.write')
  update(
    @CurrentOrg() org: OrgContext,
    @Param('unitId') unitId: string,
    @Body({ schema: updateUnitSchema }) body: UpdateUnitInput,
  ) {
    return this.units.update(org, unitId, body);
  }

  @Delete(':unitId')
  @HttpCode(204)
  @RequirePermission('units.write')
  async remove(@CurrentOrg() org: OrgContext, @Param('unitId') unitId: string) {
    await this.units.remove(org, unitId);
  }
}
