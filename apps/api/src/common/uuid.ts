import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';

/** Returns the id when it is a valid UUID, otherwise answers 404 like any unknown record. */
export function asUuid(value: string | undefined): string {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) {
    throw new NotFoundException();
  }
  return parsed.data;
}
