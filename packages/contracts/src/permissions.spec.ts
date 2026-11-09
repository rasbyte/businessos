import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions.js';

describe('hasPermission', () => {
  it('lets owners do everything', () => {
    expect(hasPermission('OWNER', [], 'units.write')).toBe(true);
  });

  it('lets managers do only what they were given', () => {
    expect(hasPermission('MANAGER', ['units.read'], 'units.read')).toBe(true);
    expect(hasPermission('MANAGER', ['units.read'], 'units.write')).toBe(false);
  });
});
