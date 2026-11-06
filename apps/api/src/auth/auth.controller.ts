import { Body, Controller, Get, Headers, HttpCode, Ip, Post, UseGuards } from '@nestjs/common';
import {
  refreshTokenSchema,
  requestCodeSchema,
  verifyCodeSchema,
  type RefreshTokenInput,
  type RequestCodeInput,
  type VerifyCodeInput,
} from '@businessos/contracts';
import { CurrentAuth, type AuthContext } from './auth-context.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-code')
  @HttpCode(202)
  async requestCode(@Body({ schema: requestCodeSchema }) body: RequestCodeInput, @Ip() ip: string) {
    await this.auth.requestCode(body.phone, ip);
    return { message: 'If this number is registered, a code has been sent.' };
  }

  @Post('verify-code')
  @HttpCode(200)
  verifyCode(
    @Body({ schema: verifyCodeSchema }) body: VerifyCodeInput,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.auth.verifyCode(body.phone, body.code, { ip, userAgent });
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Body({ schema: refreshTokenSchema }) body: RefreshTokenInput,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string | undefined,
  ) {
    return this.auth.refresh(body.refreshToken, { ip, userAgent });
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(@CurrentAuth() auth: AuthContext) {
    await this.auth.logout(auth.sessionId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth.userId);
  }
}
