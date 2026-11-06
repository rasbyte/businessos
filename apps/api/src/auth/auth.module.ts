import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';
import { ConsoleSmsSender } from './sms/console-sms-sender.js';
import { SmsSender } from './sms/sms-sender.js';
import { TokenService } from './token.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    OtpService,
    TokenService,
    {
      provide: SmsSender,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): SmsSender => {
        if (config.get('NODE_ENV', { infer: true }) === 'production') {
          throw new Error('No SMS provider is configured for production.');
        }
        return new ConsoleSmsSender();
      },
    },
  ],
  exports: [AuthGuard, TokenService],
})
export class AuthModule {}
