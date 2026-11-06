import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TokenService } from './token.service.js';

function createService(secret: string): TokenService {
  return new TokenService({ get: () => secret } as never);
}

describe('TokenService', () => {
  const service = createService('a'.repeat(40));

  it('signs and verifies an access token', async () => {
    const token = await service.signAccessToken('user-1', 'session-1');
    await expect(service.verifyAccessToken(token)).resolves.toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
    });
  });

  it('rejects a tampered token', async () => {
    const token = await service.signAccessToken('user-1', 'session-1');
    await expect(service.verifyAccessToken(`${token.slice(0, -3)}abc`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createService('b'.repeat(40)).signAccessToken('user-1', 'session-1');
    await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates unique refresh tokens whose hash matches', () => {
    const first = service.createRefreshToken();
    const second = service.createRefreshToken();
    expect(first.token).not.toBe(second.token);
    expect(service.hashRefreshToken(first.token)).toBe(first.hash);
  });
});
