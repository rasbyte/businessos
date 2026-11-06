import { fileURLToPath } from 'node:url';
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { RedisModule } from './redis/redis.module.js';

// The .env file lives at the repository root, three folders above this file
// (both in src/ and in the compiled dist/). It is optional: in production the
// values come from real environment variables.
const envFilePath = fileURLToPath(new URL('../../../.env', import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath, validationSchema: envSchema }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: StandardSchemaValidationPipe }],
})
export class AppModule {}
