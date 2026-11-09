import Link from 'next/link';
import { hasPermission } from '@businessos/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import { UnitCard } from '@/components/unit-card';
import { requireOrgAccess } from '@/lib/auth';
import { listUnits } from '@/lib/rent-api';
import { countUnits, filterUnits, parseUnitFilter, UNIT_FILTERS } from '@/lib/unit-filter';

export default async function UnitsPage(props: PageProps<'/units'>) {
  const { org, role, permissions } = await requireOrgAccess();
  const t = await getTranslations('Units');
  const locale = (await getLocale()) === 'bn' ? 'bn' : 'en';
  const filter = parseUnitFilter((await props.searchParams).filter);

  const result = await listUnits(org.id);
  if (!result.ok) {
    throw new Error(`Could not load the units (status ${result.status}).`);
  }

  const counts = countUnits(result.data);
  const visible = filterUnits(result.data, filter);
  const canWrite = hasPermission(role, permissions, 'units.write');

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {canWrite ? (
          <Link
            href="/units/new"
            className="flex h-12 items-center rounded-xl bg-brand px-5 text-base font-semibold text-white"
          >
            {t('add')}
          </Link>
        ) : null}
      </div>

      <nav aria-label={t('title')} className="grid grid-cols-4 gap-2">
        {UNIT_FILTERS.map((item) => (
          <Link
            key={item}
            href={item === 'all' ? '/units' : `/units?filter=${item}`}
            aria-current={item === filter ? 'page' : undefined}
            className={`flex h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold ${
              item === filter ? 'border-brand bg-brand text-white' : 'border-line bg-card'
            }`}
          >
            <span>{t(`filters.${item}`)}</span>
            <span>{counts[item].toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}</span>
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4">
          <p className="text-lg font-bold">{t('empty')}</p>
          {canWrite ? <p className="text-base text-ink-muted">{t('emptyHint')}</p> : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((unit) => (
            <UnitCard key={unit.id} unit={unit} locale={locale} />
          ))}
        </ul>
      )}
    </>
  );
}
