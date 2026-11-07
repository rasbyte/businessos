import { z } from 'zod';

const schema = z.object({
  /** Address of the BusinessOS API. */
  API_URL: z.url().default('http://localhost:3000'),
});

export const env = schema.parse(process.env);
