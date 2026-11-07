import { describe, expect, it } from 'vitest';
import bn from '../../messages/bn.json';
import en from '../../messages/en.json';

function flatten(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') {
    return [[prefix, value]];
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('messages', () => {
  it('Bangla and English have exactly the same keys', () => {
    const bnKeys = flatten(bn)
      .map(([key]) => key)
      .sort();
    const enKeys = flatten(en)
      .map(([key]) => key)
      .sort();
    expect(bnKeys).toEqual(enKeys);
  });

  it('has no empty translations', () => {
    const empty = [...flatten(bn), ...flatten(en)].filter(([, text]) => text.trim() === '');
    expect(empty).toEqual([]);
  });
});
