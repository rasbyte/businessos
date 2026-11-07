import { describe, expect, it } from 'vitest';
import { authResponseSchema, meResponseSchema } from './auth.js';

const user = {
  id: '01a1b00d-ece6-7331-b0ae-35fdb5276caa',
  phone: '+8801700000001',
  name: null,
  language: 'BN',
  platformRole: 'DEVELOPER',
};

describe('API response schemas', () => {
  it('accepts the login response', () => {
    const parsed = authResponseSchema.parse({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 900,
      user,
    });
    expect(parsed.user.platformRole).toBe('DEVELOPER');
  });

  it('accepts the profile response with memberships', () => {
    const parsed = meResponseSchema.parse({
      ...user,
      memberships: [
        {
          role: 'OWNER',
          permissions: [],
          organization: { id: 'o1', name: 'ICT Station 403', type: 'INTERNAL', status: 'ACTIVE' },
        },
      ],
    });
    expect(parsed.memberships).toHaveLength(1);
  });
});
