import type { INestApplication } from '@nestjs/common';

/** HTTP setup shared by the real server and the end-to-end tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api', { exclude: ['health'] });
}
