import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { SmsSender } from '../src/auth/sms/sms-sender.js';
import { DatabaseService } from '../src/database/database.service.js';
import { RedisService } from '../src/redis/redis.service.js';

const PHONE = '+8801700000097';
const sent: string[] = [];

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

describe('Login flow (e2e)', () => {
  let app: INestApplication;
  let url: string;

  function post(path: string, body: unknown, token?: string) {
    return fetch(`${url}/api/auth/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  function me(token?: string) {
    return fetch(`${url}/api/auth/me`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  }

  async function requestCode(): Promise<string> {
    sent.length = 0;
    await post('request-code', { phone: PHONE });
    return /\b(\d{6})\b/.exec(sent[0] ?? '')?.[1] ?? '';
  }

  async function login(): Promise<Tokens> {
    const code = await requestCode();
    const response = await post('verify-code', { phone: PHONE, code });
    expect(response.status).toBe(200);
    return (await response.json()) as Tokens;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SmsSender)
      .useValue({
        send: async (_to: string, message: string) => {
          sent.push(message);
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

  it('logs in with a valid code and reads the profile', async () => {
    const tokens = await login();
    const response = await me(tokens.accessToken);
    expect(response.status).toBe(200);
    expect(((await response.json()) as { phone: string }).phone).toBe(PHONE);
  });

  it('rejects a wrong code', async () => {
    await requestCode();
    const response = await post('verify-code', { phone: PHONE, code: '000000' });
    expect(response.status).toBe(401);
  });

  it('rejects requests without a valid token', async () => {
    expect((await me()).status).toBe(401);
    expect((await me('not-a-token')).status).toBe(401);
  });

  it('rotates refresh tokens and ends every session when an old one is reused', async () => {
    const first = await login();
    const refreshed = await post('refresh', { refreshToken: first.refreshToken });
    expect(refreshed.status).toBe(200);
    const second = (await refreshed.json()) as Tokens;
    expect((await me(second.accessToken)).status).toBe(200);

    const reused = await post('refresh', { refreshToken: first.refreshToken });
    expect(reused.status).toBe(401);
    expect((await me(second.accessToken)).status).toBe(401);
  });

  it('logout ends the session immediately', async () => {
    const tokens = await login();
    expect((await post('logout', {}, tokens.accessToken)).status).toBe(204);
    expect((await me(tokens.accessToken)).status).toBe(401);
  });
});
