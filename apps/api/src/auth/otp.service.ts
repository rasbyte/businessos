import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { RedisService } from '../redis/redis.service.js';

const CODE_TTL_SECONDS = 300;
const COOLDOWN_SECONDS = 60;
const HOUR_SECONDS = 3600;
const HOURLY_LIMIT_PER_PHONE = 5;
const HOURLY_LIMIT_PER_IP = 20;
const MAX_ATTEMPTS = 5;

function tooManyRequests(message: string): HttpException {
  return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
}

@Injectable()
export class OtpService {
  private readonly secret: string;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService<Env, true>,
  ) {
    this.secret = config.get('OTP_SECRET', { infer: true });
  }

  /** Throws 429 when this phone number or this caller asks for codes too often. */
  async assertCanRequest(phone: string, ip: string): Promise<void> {
    const cooldown = await this.redis.client.set(
      `otp:cooldown:${phone}`,
      '1',
      'EX',
      COOLDOWN_SECONDS,
      'NX',
    );
    if (cooldown === null) {
      throw tooManyRequests('Please wait a minute before asking for another code.');
    }

    const phoneCount = await this.count(`otp:hourly:phone:${phone}`, HOUR_SECONDS);
    const ipCount = await this.count(`otp:hourly:ip:${ip}`, HOUR_SECONDS);
    if (phoneCount > HOURLY_LIMIT_PER_PHONE || ipCount > HOURLY_LIMIT_PER_IP) {
      throw tooManyRequests('Too many code requests. Please try again later.');
    }
  }

  /** Creates a new 6 digit code, stores only its keyed hash, and returns the code. */
  async issue(phone: string): Promise<string> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.redis.client
      .multi()
      .set(`otp:code:${phone}`, this.hash(phone, code), 'EX', CODE_TTL_SECONDS)
      .del(`otp:attempts:${phone}`)
      .exec();
    return code;
  }

  /** True only for the right code, within the time and attempt limits. A good code works once. */
  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.client.get(`otp:code:${phone}`);
    if (stored === null) {
      return false;
    }

    const attempts = await this.count(`otp:attempts:${phone}`, CODE_TTL_SECONDS);
    if (attempts > MAX_ATTEMPTS) {
      await this.redis.client.del(`otp:code:${phone}`);
      return false;
    }

    const expected = Buffer.from(stored, 'hex');
    const actual = Buffer.from(this.hash(phone, code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return false;
    }

    await this.redis.client.del(`otp:code:${phone}`, `otp:attempts:${phone}`);
    return true;
  }

  private async count(key: string, ttlSeconds: number): Promise<number> {
    const value = await this.redis.client.incr(key);
    if (value === 1) {
      await this.redis.client.expire(key, ttlSeconds);
    }
    return value;
  }

  private hash(phone: string, code: string): string {
    return createHmac('sha256', this.secret).update(`${phone}:${code}`).digest('hex');
  }
}
