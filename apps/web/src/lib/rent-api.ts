import 'server-only';
import {
  propertyResponseSchema,
  unitResponseSchema,
  type CreateUnitInput,
} from '@businessos/contracts';
import { z } from 'zod';
import { apiRequest } from './api-client';

export function listUnits(orgId: string) {
  return apiRequest(`/orgs/${orgId}/units`, z.array(unitResponseSchema));
}

export function listProperties(orgId: string) {
  return apiRequest(`/orgs/${orgId}/properties`, z.array(propertyResponseSchema));
}

export function createUnit(orgId: string, input: CreateUnitInput) {
  return apiRequest(`/orgs/${orgId}/units`, unitResponseSchema, { method: 'POST', body: input });
}
