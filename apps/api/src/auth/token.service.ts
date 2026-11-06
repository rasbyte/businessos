import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, SignJWT } from 'jose';
import type { Env } from '../config/env.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const ISSUER = 'businessos';

export interface AccessClaims {
  userId: string;
  sessionId: string;
}

@Injectable()
export class TokenService {
  private readonly key: Uint8Array;

  constructor(config: ConfigService<Env, true>) {
    this.key = new TextEncoder().encode(config.get('JWT_SECRET', { infer: true }));
  }

  async signAccessToken(userId: string, sessionId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(ISSUER)
      .setSubject(userId)
      .setIssuedAt(now)
      .setExpirationTime(now + ACCESS_TOKEN_TTL_SECONDS)
      .sign(this.key);
  }

  async verifyAccessToken(token: string): Promise<AccessClaims> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string' || typeof payload['sid'] !== 'string') {
        throw new Error('Missing claims');
      }
      return { userId: payload.sub, sessionId: payload['sid'] };
    } catch {
      throw new UnauthorizedException();
    }
  }

  /** A random refresh token. Only its hash is stored. */
  createRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hashRefreshToken(token) };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
