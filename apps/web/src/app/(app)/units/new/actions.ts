'use server';

import { redirect } from 'next/navigation';
import { createUnitSchema } from '@businessos/contracts';
import { requireOrgAccess } from '@/lib/auth';
import { createUnit } from '@/lib/rent-api';
import { buildCreateUnitInput } from '@/lib/unit-form';
import type { UnitFormState } from './unit-form-state';

function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      values[key] = value;
    }
  }
  return values;
}

export async function createUnitAction(
  _previous: UnitFormState,
  formData: FormData,
): Promise<UnitFormState> {
  // Actions can be called directly, so they check who the caller is themselves.
  const { org } = await requireOrgAccess();
  const values = submittedValues(formData);

  const parsed = createUnitSchema.safeParse(buildCreateUnitInput(formData));
  if (!parsed.success) {
    return { error: 'invalid', values };
  }

  const result = await createUnit(org.id, parsed.data);
  if (result.ok) {
    redirect('/units');
  }
  if (result.status === 409) return { error: 'duplicate', values };
  if (result.status === 403 || result.status === 404) return { error: 'no_access', values };
  return { error: 'unavailable', values };
}
