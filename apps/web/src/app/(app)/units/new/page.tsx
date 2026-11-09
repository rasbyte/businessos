import { redirect } from 'next/navigation';
import { hasPermission } from '@businessos/contracts';
import { getTranslations } from 'next-intl/server';
import { requireOrgAccess } from '@/lib/auth';
import { listProperties } from '@/lib/rent-api';
import { UnitForm } from './unit-form';

export default async function NewUnitPage() {
  const { org, role, permissions } = await requireOrgAccess();
  if (!hasPermission(role, permissions, 'units.write')) {
    redirect('/units');
  }

  const t = await getTranslations('UnitForm');
  const result = await listProperties(org.id);
  if (!result.ok) {
    throw new Error(`Could not load the buildings (status ${result.status}).`);
  }

  return (
    <>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {result.data.length === 0 ? (
        <p className="text-base text-ink-muted">{t('noProperty')}</p>
      ) : (
        <UnitForm properties={result.data.map(({ id, name }) => ({ id, name }))} />
      )}
    </>
  );
}
