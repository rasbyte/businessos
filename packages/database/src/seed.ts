import { createPrismaClient } from './index.js';

const E164 = /^\+[1-9][0-9]{7,14}$/;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const phone = process.env.DEVELOPER_PHONE;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!phone || !E164.test(phone)) {
    throw new Error('DEVELOPER_PHONE must be in international format, for example +8801XXXXXXXXX');
  }

  const db = createPrismaClient(databaseUrl);
  try {
    const developer =
      (await db.user.findFirst({ where: { platformRole: 'DEVELOPER' } })) ??
      (await db.user.create({ data: { phone, name: 'Developer', platformRole: 'DEVELOPER' } }));

    const organization =
      (await db.organization.findFirst({ where: { type: 'INTERNAL' } })) ??
      (await db.organization.create({ data: { name: 'ICT Station 403', type: 'INTERNAL' } }));

    await db.membership.upsert({
      where: {
        userId_organizationId: { userId: developer.id, organizationId: organization.id },
      },
      update: {},
      create: { userId: developer.id, organizationId: organization.id, role: 'OWNER' },
    });

    const business =
      (await db.business.findFirst({
        where: { organizationId: organization.id, type: 'RENTAL' },
      })) ??
      (await db.business.create({
        data: { organizationId: organization.id, type: 'RENTAL', name: 'ICT Station 403 Rent' },
      }));

    const property =
      (await db.property.findFirst({ where: { businessId: business.id } })) ??
      (await db.property.create({ data: { businessId: business.id, name: 'ICT Station 403' } }));

    console.log('Developer', developer.id);
    console.log('Internal organization', organization.id);
    console.log('Rental business', business.id, 'property', property.id);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
