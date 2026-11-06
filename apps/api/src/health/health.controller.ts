import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { RedisService } from '../redis/redis.service.js';

type CheckResult = 'up' | 'down';

@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.all([
      this.database.client.$queryRaw`SELECT 1`.then(
        (): CheckResult => 'up',
        (): CheckResult => 'down',
      ),
      this.redis.client.ping().then(
        (): CheckResult => 'up',
        (): CheckResult => 'down',
      ),
    ]);

    const body = {
      status: database === 'up' && redis === 'up' ? 'ok' : 'degraded',
      checks: { database, redis },
    };

    if (body.status !== 'ok') {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }
}
