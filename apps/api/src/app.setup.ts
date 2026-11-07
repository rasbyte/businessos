import type { INestApplication } from '@nestjs/common';
import type { Application } from 'express';

/** HTTP setup shared by the real server and the end-to-end tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Trust the client address forwarded by our own web server, but only when the
  // request comes from a private network, so outsiders cannot fake their address.
  const express = app.getHttpAdapter().getInstance() as Application;
  express.set('trust proxy', 'loopback, linklocal, uniquelocal');
}
