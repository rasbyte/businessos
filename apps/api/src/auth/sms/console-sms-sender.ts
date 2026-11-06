import { Logger } from '@nestjs/common';
import { SmsSender } from './sms-sender.js';

/** Development only: prints the message in the server log instead of sending it. */
export class ConsoleSmsSender extends SmsSender {
  private readonly logger = new Logger('SMS');

  async send(to: string, message: string): Promise<void> {
    this.logger.warn(`[DEV SMS] to ${to}: ${message}`);
  }
}
