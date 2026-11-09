import type { UnitResponse } from '@businessos/contracts';
import { useTranslations } from 'next-intl';
import { formatTaka } from '@/lib/money';

const CHIP_CLASSES = {
  vacant: 'border-ink-muted text-ink-muted',
  occupied: 'border-brand text-brand',
  pending: 'border-warning text-warning',
} as const;

export function UnitCard({ unit, locale }: { unit: UnitResponse; locale: 'bn' | 'en' }) {
  const t = useTranslations('Units');
  const lease = unit.currentLease;
  const state =
    unit.status === 'VACANT'
      ? 'vacant'
      : lease && lease.status !== 'ACTIVE'
        ? 'pending'
        : 'occupied';

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="min-w-0">
        <p className="text-lg font-bold">
          {t(`type.${unit.type}`)} {unit.number}
        </p>
        <p className="truncate text-base text-ink-muted">
          {lease
            ? `${lease.renter.name} - ${formatTaka(lease.monthlyRent, locale)}`
            : t('noRenter')}
        </p>
        <p className="text-sm text-ink-muted">{unit.propertyName}</p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${CHIP_CLASSES[state]}`}
      >
        {t(`state.${state}`)}
      </span>
    </li>
  );
}
