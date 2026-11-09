/** Formats whole poisha as taka with the local digit grouping, for example ৳ 18,50,000. */
export function formatTaka(poisha: number, locale: 'bn' | 'en'): string {
  const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-IN', {
    maximumFractionDigits: 0,
  });
  return `৳ ${formatter.format(Math.round(poisha / 100))}`;
}
