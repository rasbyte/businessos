import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// The .env file lives at the repository root. Scripts run from this package folder.
config({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
