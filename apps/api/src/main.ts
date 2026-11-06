import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
app.setGlobalPrefix('api', { exclude: ['health'] });

const config = app.get<ConfigService<Env, true>>(ConfigService);
await app.listen(config.get('PORT', { infer: true }));
