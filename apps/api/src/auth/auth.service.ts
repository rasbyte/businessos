import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@businessos/database';
import { DatabaseService } from '../database/database.service.js';
import { OtpService } from './otp.service.js';
import { SmsSender } from './sms/sms-sender.js';
import { ACCESS_TOKEN_TTL_SECONDS, TokenService } from './token.service.js';

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// A refresh token used again within this time is refused but does not end the sessions.
const REUSE_GRACE_MS = 10_000;

export interface ClientInfo {
  ip: string;
  userAgent: string | undefined;
}

export type PublicUser = Pick<User, 'id' | 'phone' | 'name' | 'language' | 'platformRole'>;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly otp: OtpService,
    private readonly sms: SmsSender,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Sends a login code when the phone number belongs to an active user.
   * Returns nothing either way, so callers cannot learn who is registered.
   */
  async requestCode(phone: string, ip: string): Promise<void> {
    await this.otp.assertCanRequest(phone, ip);

    const user = await this.database.client.user.findUnique({
      where: { phone },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      return;
    }

    const code = await this.otp.issue(phone);
    await this.sms.send(phone, `Your BusinessOS code is ${code}. It expires in 5 minutes.`);
  }

  /** Checks the code and starts a session. Every failure gives the same answer. */
  async verifyCode(phone: string, code: string, client: ClientInfo): Promise<AuthResult> {
    const valid = await this.otp.verify(phone, code);
    const user = valid ? await this.database.client.user.findUnique({ where: { phone } }) : null;
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid or expired code.');
    }

    await this.database.client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.startSession(user, client);
  }

  /** Swaps a refresh token for a new pair. A refresh token works only once. */
  async refresh(refreshToken: string, client: ClientInfo): Promise<AuthResult> {
    const session = await this.database.client.session.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(refreshToken) },
      include: { user: true },
    });
    if (!session) {
      throw new UnauthorizedException();
    }

    const claimed = await this.database.client.session.updateMany({
      where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) {
      // A token that was already used coming back may mean it was stolen: end every session.
      const reusedLongAgo =
        session.revokedAt !== null && Date.now() - session.revokedAt.getTime() > REUSE_GRACE_MS;
      if (reusedLongAgo) {
        await this.database.client.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException();
    }
    if (!session.user.isActive) {
      throw new UnauthorizedException();
    }

    return this.startSession(session.user, client);
  }

  async logout(sessionId: string): Promise<void> {
    await this.database.client.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    return this.database.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        language: true,
        platformRole: true,
        memberships: {
          where: { isActive: true },
          select: {
            role: true,
            permissions: true,
            organization: { select: { id: true, name: true, type: true, status: true } },
          },
        },
      },
    });
  }

  private async startSession(user: User, client: ClientInfo): Promise<AuthResult> {
    const refresh = this.tokens.createRefreshToken();
    const session = await this.database.client.session.create({
      data: {
        userId: user.id,
        tokenHash: refresh.hash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        ip: client.ip,
        userAgent: client.userAgent?.slice(0, 255),
      },
    });

    return {
      accessToken: await this.tokens.signAccessToken(user.id, session.id),
      refreshToken: refresh.token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        language: user.language,
        platformRole: user.platformRole,
      },
    };
  }
}
