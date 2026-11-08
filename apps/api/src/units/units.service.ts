import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateUnitInput, ListUnitsQuery, UpdateUnitInput } from '@businessos/contracts';
import { Prisma } from '@businessos/database';
import type { OrgContext } from '../access/org-context.js';
import { asUuid } from '../common/uuid.js';
import { DatabaseService } from '../database/database.service.js';

const OPEN_LEASE_STATUSES = ['DRAFT', 'SENT', 'SIGNED_BY_RENTER', 'ACTIVE'] as const;

const unitSelect = {
  id: true,
  propertyId: true,
  type: true,
  number: true,
  floor: true,
  areaSqft: true,
  bedrooms: true,
  bathrooms: true,
  shopCategory: true,
  status: true,
  property: { select: { name: true } },
  leases: {
    where: { status: { in: [...OPEN_LEASE_STATUSES] } },
    take: 1,
    select: {
      id: true,
      status: true,
      monthlyRent: true,
      renter: { select: { id: true, name: true, phone: true } },
    },
  },
} satisfies Prisma.UnitSelect;

type UnitRow = Prisma.UnitGetPayload<{ select: typeof unitSelect }>;

function toResponse(row: UnitRow) {
  const { property, leases, ...unit } = row;
  return { ...unit, propertyName: property.name, currentLease: leases[0] ?? null };
}

/** Only units of this organization, and of one business when the member is limited to it. */
function unitScope(org: OrgContext): Prisma.UnitWhereInput {
  return {
    property: {
      business: {
        organizationId: org.organizationId,
        ...(org.businessId ? { id: org.businessId } : {}),
      },
    },
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class UnitsService {
  constructor(private readonly database: DatabaseService) {}

  async list(org: OrgContext, query: ListUnitsQuery) {
    const rows = await this.database.client.unit.findMany({
      where: { ...unitScope(org), type: query.type, status: query.status },
      orderBy: [{ property: { name: 'asc' } }, { number: 'asc' }],
      select: unitSelect,
    });
    return rows.map(toResponse);
  }

  async get(org: OrgContext, unitId: string) {
    return toResponse(await this.findOrThrow(org, unitId));
  }

  async create(org: OrgContext, input: CreateUnitInput) {
    const property = await this.database.client.property.findFirst({
      where: {
        id: input.propertyId,
        business: {
          organizationId: org.organizationId,
          ...(org.businessId ? { id: org.businessId } : {}),
        },
      },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found.');
    }

    try {
      const row = await this.database.client.unit.create({
        data:
          input.type === 'FLAT'
            ? {
                propertyId: input.propertyId,
                type: 'FLAT',
                number: input.number,
                floor: input.floor,
                areaSqft: input.areaSqft,
                bedrooms: input.bedrooms,
                bathrooms: input.bathrooms,
              }
            : {
                propertyId: input.propertyId,
                type: 'SHOP',
                number: input.number,
                floor: input.floor,
                areaSqft: input.areaSqft,
                shopCategory: input.shopCategory,
              },
        select: unitSelect,
      });
      return toResponse(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A unit with this number already exists in this property.');
      }
      throw error;
    }
  }

  async update(org: OrgContext, unitId: string, input: UpdateUnitInput) {
    const unit = await this.findOrThrow(org, unitId);
    if (unit.type === 'SHOP' && (input.bedrooms !== undefined || input.bathrooms !== undefined)) {
      throw new BadRequestException('Only flats have bedrooms and bathrooms.');
    }
    if (unit.type === 'FLAT' && input.shopCategory !== undefined) {
      throw new BadRequestException('Only shops have a shop category.');
    }

    try {
      const row = await this.database.client.unit.update({
        where: { id: unit.id },
        data: input,
        select: unitSelect,
      });
      return toResponse(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A unit with this number already exists in this property.');
      }
      throw error;
    }
  }

  async remove(org: OrgContext, unitId: string): Promise<void> {
    const unit = await this.findOrThrow(org, unitId);
    const leaseCount = await this.database.client.lease.count({ where: { unitId: unit.id } });
    if (leaseCount > 0) {
      throw new ConflictException('This unit has lease history and cannot be deleted.');
    }
    await this.database.client.unit.delete({ where: { id: unit.id } });
  }

  private async findOrThrow(org: OrgContext, unitId: string) {
    const row = await this.database.client.unit.findFirst({
      where: { id: asUuid(unitId), ...unitScope(org) },
      select: unitSelect,
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }
}
