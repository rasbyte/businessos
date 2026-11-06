import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { OtpService } from '../src/auth/otp.service.js';
import { SmsSender } from '../src/auth/sms/sms-sender.js';
import { DatabaseService } from '../src/database/database.service.js';
import { RedisService } from '../src/redis/redis.service.js';

const PHONE = '+8801700000099';
const sent: Array<{ to: string; message: string }> = [];

describe('Auth request-code (e2e)', () => {
  let app: INestApplication;
  let url: string;

  function requestCode(phone: string) {
    return fetch(`${url}/api/auth/request-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SmsSender)
      .useValue({
        send: async (to: string, message: string) => {
          sent.push({ to, message });
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0);
    url = await app.getUrl();
    await app.get(DatabaseService).client.user.upsert({
      where: { phone: PHONE },
      update: { isActive: true },
      create: { phone: PHONE },
    });
  });

  beforeEach(async () => {
    sent.length = 0;
    const redis = app.get(RedisService).client;
    const keys = await redis.keys('otp:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    await app.get(DatabaseService).client.user.deleteMany({ where: { phone: PHONE } });
    await app.close();
  });

  it('rejects an invalid phone number', async () => {
    const response = await requestCode('123');
    expect(response.status).toBe(400);
  });

  it('sends a working code to a registered number', async () => {
    const response = await requestCode('01700000099');
    expect(response.status).toBe(202);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe(PHONE);
    const code = /\b(\d{6})\b/.exec(sent[0]?.message ?? '')?.[1] ?? '';
    const otp = app.get(OtpService);
    expect(await otp.verify(PHONE, '000000')).toBe(false);
    expect(await otp.verify(PHONE, code)).toBe(true);
    expect(await otp.verify(PHONE, code)).toBe(false);
  });

  it('answers the same way for an unknown number and sends nothing', async () => {
    const response = await requestCode('+8801700000098');
    expect(response.status).toBe(202);
    expect(sent).toHaveLength(0);
  });

  it('blocks a second request within a minute', async () => {
    expect((await requestCode(PHONE)).status).toBe(202);
    expect((await requestCode(PHONE)).status).toBe(429);
  });
});
