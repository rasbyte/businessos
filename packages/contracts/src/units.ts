import { z } from 'zod';

const unitNumber = z.string().trim().min(1).max(20);
const floor = z.string().trim().max(20);
const area = z.number().int().positive().max(100_000);
const rooms = z.number().int().min(0).max(20);
const category = z.string().trim().max(60);

export const createUnitSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('FLAT'),
    propertyId: z.uuid(),
    number: unitNumber,
    floor: floor.optional(),
    areaSqft: area.optional(),
    bedrooms: rooms.optional(),
    bathrooms: rooms.optional(),
  }),
  z.strictObject({
    type: z.literal('SHOP'),
    propertyId: z.uuid(),
    number: unitNumber,
    floor: floor.optional(),
    areaSqft: area.optional(),
    shopCategory: category.optional(),
  }),
]);
export type CreateUnitInput = z.infer<typeof createUnitSchema>;

/** The type of a unit never changes. Send null to clear a value. */
export const updateUnitSchema = z.strictObject({
  number: unitNumber.optional(),
  floor: floor.nullable().optional(),
  areaSqft: area.nullable().optional(),
  bedrooms: rooms.nullable().optional(),
  bathrooms: rooms.nullable().optional(),
  shopCategory: category.nullable().optional(),
});
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

export const listUnitsQuerySchema = z.strictObject({
  type: z.enum(['FLAT', 'SHOP']).optional(),
  status: z.enum(['VACANT', 'OCCUPIED']).optional(),
});
export type ListUnitsQuery = z.infer<typeof listUnitsQuerySchema>;

export const unitResponseSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  propertyName: z.string(),
  type: z.enum(['FLAT', 'SHOP']),
  number: z.string(),
  floor: z.string().nullable(),
  areaSqft: z.number().nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  shopCategory: z.string().nullable(),
  status: z.enum(['VACANT', 'OCCUPIED']),
  /** Money amounts are whole poisha: 1850000 is 18,500 taka. */
  currentLease: z
    .object({
      id: z.string(),
      status: z.enum(['DRAFT', 'SENT', 'SIGNED_BY_RENTER', 'ACTIVE']),
      monthlyRent: z.number().int(),
      renter: z.object({ id: z.string(), name: z.string(), phone: z.string() }),
    })
    .nullable(),
});
export type UnitResponse = z.infer<typeof unitResponseSchema>;

export const propertyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  businessId: z.string(),
  businessName: z.string(),
});
export type PropertyResponse = z.infer<typeof propertyResponseSchema>;
