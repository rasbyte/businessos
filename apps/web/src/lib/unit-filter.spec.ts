import type { UnitResponse } from '@businessos/contracts';
import { describe, expect, it } from 'vitest';
import { countUnits, filterUnits, parseUnitFilter } from './unit-filter';

function unit(overrides: Partial<UnitResponse>): UnitResponse {
  return {
    id: 'u',
    propertyId: 'p',
    propertyName: 'Building',
    type: 'SHOP',
    number: '1',
    floor: null,
    areaSqft: null,
    bedrooms: null,
    bathrooms: null,
    shopCategory: null,
    status: 'VACANT',
    currentLease: null,
    ...overrides,
  };
}

const units = [
  unit({ id: '1', type: 'SHOP', status: 'OCCUPIED' }),
  unit({ id: '2', type: 'SHOP', status: 'VACANT' }),
  unit({ id: '3', type: 'FLAT', status: 'OCCUPIED' }),
];

describe('unit filters', () => {
  it('reads the filter from the address and falls back to all', () => {
    expect(parseUnitFilter('shops')).toBe('shops');
    expect(parseUnitFilter(['flats', 'x'])).toBe('flats');
    expect(parseUnitFilter('nonsense')).toBe('all');
    expect(parseUnitFilter(undefined)).toBe('all');
  });

  it('filters by type and by vacancy', () => {
    expect(filterUnits(units, 'shops').map((item) => item.id)).toEqual(['1', '2']);
    expect(filterUnits(units, 'flats').map((item) => item.id)).toEqual(['3']);
    expect(filterUnits(units, 'vacant').map((item) => item.id)).toEqual(['2']);
    expect(filterUnits(units, 'all')).toHaveLength(3);
  });

  it('counts every tab', () => {
    expect(countUnits(units)).toEqual({ all: 3, shops: 2, flats: 1, vacant: 1 });
  });
});
