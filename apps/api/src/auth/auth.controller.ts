import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { requestCodeSchema, type RequestCodeInput } from '@businessos/contracts';
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
}
