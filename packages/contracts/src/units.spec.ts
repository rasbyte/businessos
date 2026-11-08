import { describe, expect, it } from 'vitest';
import { createUnitSchema, updateUnitSchema } from './units.js';

const propertyId = '01a1b78e-899b-719a-a5b4-6525a9ec09cb';

describe('createUnitSchema', () => {
  it('accepts a flat with rooms and a shop with a category', () => {
    expect(
      createUnitSchema.safeParse({
        type: 'FLAT',
        propertyId,
        number: '4A',
        bedrooms: 3,
        bathrooms: 2,
      }).success,
    ).toBe(true);
    expect(
      createUnitSchema.safeParse({
        type: 'SHOP',
        propertyId,
        number: '105',
        shopCategory: 'Mobile',
      }).success,
    ).toBe(true);
  });

  it('rejects rooms on a shop, a flat category, a bad property id and an empty number', () => {
    expect(
      createUnitSchema.safeParse({ type: 'SHOP', propertyId, number: '105', bedrooms: 2 }).success,
    ).toBe(false);
    expect(
      createUnitSchema.safeParse({ type: 'FLAT', propertyId, number: '4A', shopCategory: 'x' })
        .success,
    ).toBe(false);
    expect(
      createUnitSchema.safeParse({ type: 'FLAT', propertyId: 'nope', number: '4A' }).success,
    ).toBe(false);
    expect(createUnitSchema.safeParse({ type: 'FLAT', propertyId, number: '  ' }).success).toBe(
      false,
    );
  });
});

describe('updateUnitSchema', () => {
  it('allows clearing a value with null and rejects an unknown field', () => {
    expect(updateUnitSchema.safeParse({ floor: null }).success).toBe(true);
    expect(updateUnitSchema.safeParse({ type: 'SHOP' }).success).toBe(false);
  });
});
