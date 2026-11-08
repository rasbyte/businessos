import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { TokenService } from '../src/auth/token.service.js';
import { DatabaseService } from '../src/database/database.service.js';

const phone = () => `+8801${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`;

interface UnitBody {
  id: string;
  propertyId: string;
  type: string;
  bedrooms: number | null;
  floor: string | null;
}

describe('Units and organization access (e2e)', () => {
  let app: INestApplication;
  let url: string;
  let db: DatabaseService['client'];

  const orgIds: string[] = [];
  const userIds: string[] = [];
  const ids = {} as Record<
    | 'orgA'
    | 'orgB'
    | 'businessA1'
    | 'propertyA1'
    | 'propertyA2'
    | 'propertyB'
    | 'unitA1'
    | 'unitA2'
    | 'unitB',
    string
  >;
  const token = {} as Record<'ownerA' | 'readerA' | 'limitedA' | 'ownerB', string>;

  async function tokenFor(userId: string): Promise<string> {
    const session = await db.session.create({
      data: { userId, tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 3_600_000) },
    });
    return app.get(TokenService).signAccessToken(userId, session.id);
  }

  async function createUser(
    organizationId: string,
    role: 'OWNER' | 'MANAGER',
    options: { permissions?: string[]; businessId?: string } = {},
  ): Promise<string> {
    const user = await db.user.create({ data: { phone: phone() } });
    userIds.push(user.id);
    await db.membership.create({
      data: {
        userId: user.id,
        organizationId,
        role,
        permissions: options.permissions ?? [],
        businessId: options.businessId ?? null,
      },
    });
    return tokenFor(user.id);
  }

  async function createOrgWithUnit(name: string, propertyCount: number) {
    const org = await db.organization.create({ data: { name } });
    orgIds.push(org.id);
    const properties: Array<{ id: string; businessId: string; unitId: string }> = [];
    for (let index = 0; index < propertyCount; index += 1) {
      const business = await db.business.create({
        data: { organizationId: org.id, type: 'RENTAL', name: `${name} business ${index}` },
      });
      const property = await db.property.create({
        data: { businessId: business.id, name: `${name} property ${index}` },
      });
      const unit = await db.unit.create({
        data: { propertyId: property.id, type: 'FLAT', number: `F${index}` },
      });
      properties.push({ id: property.id, businessId: business.id, unitId: unit.id });
    }
    return { orgId: org.id, properties };
  }

  function call(method: string, path: string, authToken?: string, body?: unknown) {
    return fetch(`${url}/api/${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0);
    url = await app.getUrl();
    db = app.get(DatabaseService).client;

    const tag = randomUUID().slice(0, 8);
    const a = await createOrgWithUnit(`Test A ${tag}`, 2);
    const b = await createOrgWithUnit(`Test B ${tag}`, 1);
    ids.orgA = a.orgId;
    ids.orgB = b.orgId;
    ids.businessA1 = a.properties[0]!.businessId;
    ids.propertyA1 = a.properties[0]!.id;
    ids.propertyA2 = a.properties[1]!.id;
    ids.propertyB = b.properties[0]!.id;
    ids.unitA1 = a.properties[0]!.unitId;
    ids.unitA2 = a.properties[1]!.unitId;
    ids.unitB = b.properties[0]!.unitId;

    token.ownerA = await createUser(ids.orgA, 'OWNER');
    token.readerA = await createUser(ids.orgA, 'MANAGER', { permissions: ['units.read'] });
    token.limitedA = await createUser(ids.orgA, 'MANAGER', {
      permissions: ['units.read'],
      businessId: ids.businessA1,
    });
    token.ownerB = await createUser(ids.orgB, 'OWNER');
  });

  afterAll(async () => {
    await db.lease.deleteMany({
      where: { unit: { property: { business: { organizationId: { in: orgIds } } } } },
    });
    await db.organization.deleteMany({ where: { id: { in: orgIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('requires a signed-in user', async () => {
    expect((await call('GET', `orgs/${ids.orgA}/units`)).status).toBe(401);
  });

  it('lets an owner create a flat and a shop, and refuses rooms on a shop', async () => {
    const flat = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'FLAT',
      propertyId: ids.propertyA1,
      number: 'T-4A',
      floor: '4th',
      bedrooms: 3,
      bathrooms: 2,
    });
    expect(flat.status).toBe(201);
    const flatBody = (await flat.json()) as UnitBody;
    expect(flatBody.type).toBe('FLAT');
    expect(flatBody.bedrooms).toBe(3);

    const shop = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'SHOP',
      propertyId: ids.propertyA1,
      number: 'T-105',
      shopCategory: 'Mobile',
    });
    expect(shop.status).toBe(201);

    const bad = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'SHOP',
      propertyId: ids.propertyA1,
      number: 'T-106',
      bedrooms: 2,
    });
    expect(bad.status).toBe(400);
  });

  it('refuses a duplicate unit number in the same property', async () => {
    const response = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'FLAT',
      propertyId: ids.propertyA1,
      number: 'T-4A',
    });
    expect(response.status).toBe(409);
  });

  it('refuses a property that belongs to another organization', async () => {
    const response = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'FLAT',
      propertyId: ids.propertyB,
      number: 'X-1',
    });
    expect(response.status).toBe(404);
  });

  it('shows each organization only its own units', async () => {
    const a = (await (
      await call('GET', `orgs/${ids.orgA}/units`, token.ownerA)
    ).json()) as UnitBody[];
    const b = (await (
      await call('GET', `orgs/${ids.orgB}/units`, token.ownerB)
    ).json()) as UnitBody[];
    const idsA = a.map((unit) => unit.id);
    const idsB = b.map((unit) => unit.id);
    expect(idsA).toContain(ids.unitA1);
    expect(idsA).not.toContain(ids.unitB);
    expect(idsB).toEqual([ids.unitB]);
  });

  it('hides another organization completely', async () => {
    expect((await call('GET', `orgs/${ids.orgA}/units`, token.ownerB)).status).toBe(404);
    expect((await call('GET', `orgs/${ids.orgB}/units/${ids.unitA1}`, token.ownerB)).status).toBe(
      404,
    );
    expect(
      (await call('PATCH', `orgs/${ids.orgB}/units/${ids.unitA1}`, token.ownerB, { floor: 'x' }))
        .status,
    ).toBe(404);
    expect(
      (await call('DELETE', `orgs/${ids.orgB}/units/${ids.unitA1}`, token.ownerB)).status,
    ).toBe(404);
    expect((await call('GET', 'orgs/not-a-uuid/units', token.ownerA)).status).toBe(404);
  });

  it('lets a read-only manager look but not change anything', async () => {
    expect((await call('GET', `orgs/${ids.orgA}/units`, token.readerA)).status).toBe(200);
    const create = await call('POST', `orgs/${ids.orgA}/units`, token.readerA, {
      type: 'FLAT',
      propertyId: ids.propertyA1,
      number: 'R-1',
    });
    expect(create.status).toBe(403);
    expect(
      (await call('DELETE', `orgs/${ids.orgA}/units/${ids.unitA1}`, token.readerA)).status,
    ).toBe(403);
  });

  it('limits a business manager to their own business', async () => {
    const response = await call('GET', `orgs/${ids.orgA}/units`, token.limitedA);
    const units = (await response.json()) as UnitBody[];
    expect(units.length).toBeGreaterThan(0);
    expect(units.every((unit) => unit.propertyId === ids.propertyA1)).toBe(true);
    expect((await call('GET', `orgs/${ids.orgA}/units/${ids.unitA2}`, token.limitedA)).status).toBe(
      404,
    );
  });

  it('updates a unit and refuses rooms on a shop', async () => {
    const updated = await call('PATCH', `orgs/${ids.orgA}/units/${ids.unitA1}`, token.ownerA, {
      floor: '2nd',
    });
    expect(updated.status).toBe(200);
    expect(((await updated.json()) as UnitBody).floor).toBe('2nd');

    const list = (await (
      await call('GET', `orgs/${ids.orgA}/units?type=SHOP`, token.ownerA)
    ).json()) as UnitBody[];
    const shop = list.find((unit) => unit.type === 'SHOP');
    expect(shop).toBeDefined();
    const bad = await call('PATCH', `orgs/${ids.orgA}/units/${shop!.id}`, token.ownerA, {
      bedrooms: 2,
    });
    expect(bad.status).toBe(400);
  });

  it('keeps units with lease history and deletes empty ones', async () => {
    const renter = await db.renter.create({
      data: { organizationId: ids.orgA, name: 'Test renter', phone: phone() },
    });
    await db.lease.create({
      data: {
        unitId: ids.unitA1,
        renterId: renter.id,
        monthlyRent: 1_850_000,
        startDate: new Date('2026-11-01'),
      },
    });
    expect(
      (await call('DELETE', `orgs/${ids.orgA}/units/${ids.unitA1}`, token.ownerA)).status,
    ).toBe(409);

    const withLease = (await (
      await call('GET', `orgs/${ids.orgA}/units/${ids.unitA1}`, token.ownerA)
    ).json()) as {
      currentLease: { monthlyRent: number } | null;
    };
    expect(withLease.currentLease?.monthlyRent).toBe(1_850_000);

    const empty = await call('POST', `orgs/${ids.orgA}/units`, token.ownerA, {
      type: 'SHOP',
      propertyId: ids.propertyA1,
      number: 'T-DEL',
    });
    const emptyId = ((await empty.json()) as UnitBody).id;
    expect((await call('DELETE', `orgs/${ids.orgA}/units/${emptyId}`, token.ownerA)).status).toBe(
      204,
    );
    expect((await call('GET', `orgs/${ids.orgA}/units/${emptyId}`, token.ownerA)).status).toBe(404);
  });

  it('lists the properties a member may use', async () => {
    const all = (await (
      await call('GET', `orgs/${ids.orgA}/properties`, token.ownerA)
    ).json()) as Array<{ id: string }>;
    expect(all.map((property) => property.id).sort()).toEqual(
      [ids.propertyA1, ids.propertyA2].sort(),
    );
    const limited = (await (
      await call('GET', `orgs/${ids.orgA}/properties`, token.limitedA)
    ).json()) as Array<{ id: string }>;
    expect(limited.map((property) => property.id)).toEqual([ids.propertyA1]);
  });
});
