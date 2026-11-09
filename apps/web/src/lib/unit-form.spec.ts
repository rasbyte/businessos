import { createUnitSchema } from '@businessos/contracts';
import { describe, expect, it } from 'vitest';
import { buildCreateUnitInput } from './unit-form';

const PROPERTY = '01a1b78e-899b-719a-a5b4-6525a9ec09cb';

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe('buildCreateUnitInput', () => {
  it('builds a valid flat and drops empty fields', () => {
    const parsed = createUnitSchema.safeParse(
      buildCreateUnitInput(
        form({
          type: 'FLAT',
          propertyId: PROPERTY,
          number: ' 3B ',
          floor: '',
          areaSqft: '',
          bedrooms: '3',
          bathrooms: '2',
        }),
      ),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({
      type: 'FLAT',
      propertyId: PROPERTY,
      number: '3B',
      bedrooms: 3,
      bathrooms: 2,
    });
  });

  it('ignores flat-only fields on a shop and keeps the category', () => {
    const parsed = createUnitSchema.safeParse(
      buildCreateUnitInput(
        form({
          type: 'SHOP',
          propertyId: PROPERTY,
          number: '104',
          bedrooms: '2',
          shopCategory: 'Mobile',
        }),
      ),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({
      type: 'SHOP',
      propertyId: PROPERTY,
      number: '104',
      shopCategory: 'Mobile',
    });
  });

  it('accepts Bangla digits in numbers', () => {
    const parsed = createUnitSchema.safeParse(
      buildCreateUnitInput(
        form({ type: 'SHOP', propertyId: PROPERTY, number: '104', areaSqft: '১২০' }),
      ),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({ areaSqft: 120 });
  });

  it('is rejected when the number is missing or a size is not a number', () => {
    expect(
      createUnitSchema.safeParse(buildCreateUnitInput(form({ type: 'FLAT', propertyId: PROPERTY })))
        .success,
    ).toBe(false);
    expect(
      createUnitSchema.safeParse(
        buildCreateUnitInput(
          form({ type: 'SHOP', propertyId: PROPERTY, number: '1', areaSqft: 'abc' }),
        ),
      ).success,
    ).toBe(false);
  });
});
