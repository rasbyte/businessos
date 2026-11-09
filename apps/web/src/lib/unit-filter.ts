import type { UnitResponse } from '@businessos/contracts';

export const UNIT_FILTERS = ['all', 'shops', 'flats', 'vacant'] as const;
export type UnitFilter = (typeof UNIT_FILTERS)[number];

export function parseUnitFilter(value: string | string[] | undefined): UnitFilter {
  const single = Array.isArray(value) ? value[0] : value;
  return UNIT_FILTERS.find((filter) => filter === single) ?? 'all';
}

export function filterUnits(units: readonly UnitResponse[], filter: UnitFilter): UnitResponse[] {
  switch (filter) {
    case 'shops':
      return units.filter((unit) => unit.type === 'SHOP');
    case 'flats':
      return units.filter((unit) => unit.type === 'FLAT');
    case 'vacant':
      return units.filter((unit) => unit.status === 'VACANT');
    default:
      return [...units];
  }
}

export function countUnits(units: readonly UnitResponse[]): Record<UnitFilter, number> {
  return {
    all: units.length,
    shops: filterUnits(units, 'shops').length,
    flats: filterUnits(units, 'flats').length,
    vacant: filterUnits(units, 'vacant').length,
  };
}
