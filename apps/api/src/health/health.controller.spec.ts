import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

function createController(databaseUp: boolean, redisUp: boolean): HealthController {
  const database = {
    client: {
      $queryRaw: () =>
        databaseUp ? Promise.resolve([{ ok: 1 }]) : Promise.reject(new Error('down')),
    },
  };
  const redis = {
    client: {
      ping: () => (redisUp ? Promise.resolve('PONG') : Promise.reject(new Error('down'))),
    },
  };
  return new HealthController(database as never, redis as never);
}

describe('HealthController', () => {
  it('reports ok when the database and redis are up', async () => {
    await expect(createController(true, true).check()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up', redis: 'up' },
    });
  });

  it('throws service unavailable when the database is down', async () => {
    await expect(createController(false, true).check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws service unavailable when redis is down', async () => {
    await expect(createController(true, false).check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
