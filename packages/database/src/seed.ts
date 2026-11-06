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
    const existing = await db.user.findFirst({ where: { platformRole: 'DEVELOPER' } });
    if (existing) {
      console.log('Developer account already exists, nothing to do.');
      return;
    }
    const developer = await db.user.create({
      data: { phone, name: 'Developer', platformRole: 'DEVELOPER' },
    });
    console.log('Created developer account', developer.id);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
