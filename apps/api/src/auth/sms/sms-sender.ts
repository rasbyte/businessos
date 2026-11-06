/** Anything that can deliver a text message. A real provider implements this. */
export abstract class SmsSender {
  abstract send(to: string, message: string): Promise<void>;
}
