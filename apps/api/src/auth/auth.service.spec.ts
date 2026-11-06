import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

function setup(user: { isActive: boolean } | null) {
  const otp = {
    assertCanRequest: vi.fn().mockResolvedValue(undefined),
    issue: vi.fn().mockResolvedValue('123456'),
  };
  const database = { client: { user: { findUnique: vi.fn().mockResolvedValue(user) } } };
  const sms = { send: vi.fn().mockResolvedValue(undefined) };
  const service = new AuthService(database as never, otp as never, sms as never);
  return { service, otp, sms };
}

describe('AuthService.requestCode', () => {
  it('sends a code to an active user', async () => {
    const { service, sms } = setup({ isActive: true });
    await service.requestCode('+8801700000001', '127.0.0.1');
    expect(sms.send).toHaveBeenCalledOnce();
    expect(sms.send.mock.calls[0]?.[1]).toContain('123456');
  });

  it('sends nothing to an unknown number but still applies the rate limit', async () => {
    const { service, otp, sms } = setup(null);
    await service.requestCode('+8801700000002', '127.0.0.1');
    expect(otp.assertCanRequest).toHaveBeenCalledOnce();
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('sends nothing to a disabled user', async () => {
    const { service, sms } = setup({ isActive: false });
    await service.requestCode('+8801700000003', '127.0.0.1');
    expect(sms.send).not.toHaveBeenCalled();
  });
});
