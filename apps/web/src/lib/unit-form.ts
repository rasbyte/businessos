import { toAsciiDigits } from '@businessos/contracts';

function text(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function whole(formData: FormData, key: string): number | undefined {
  const value = text(formData, key);
  return value === undefined ? undefined : Number(toAsciiDigits(value));
}

/** Turns the add-unit form into the shape the API expects. Only fields of the chosen type are used. */
export function buildCreateUnitInput(formData: FormData): unknown {
  const type = text(formData, 'type');
  const common = {
    type,
    propertyId: text(formData, 'propertyId'),
    number: text(formData, 'number'),
    floor: text(formData, 'floor'),
    areaSqft: whole(formData, 'areaSqft'),
  };

  if (type === 'FLAT') {
    return {
      ...common,
      bedrooms: whole(formData, 'bedrooms'),
      bathrooms: whole(formData, 'bathrooms'),
    };
  }
  if (type === 'SHOP') {
    return { ...common, shopCategory: text(formData, 'shopCategory') };
  }
  return common;
}
