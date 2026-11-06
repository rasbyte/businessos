import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { OtpService } from './otp.service.js';
import { SmsSender } from './sms/sms-sender.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly otp: OtpService,
    private readonly sms: SmsSender,
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
}
