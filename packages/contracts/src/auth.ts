import { z } from 'zod';
import { phoneSchema } from './phone.js';

export const requestCodeSchema = z.object({ phone: phoneSchema });
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;
