import { getTranslations } from 'next-intl/server';
import { logoutAction } from '@/app/login/actions';
import { requireOrgAccess } from '@/lib/auth';

export default async function HomePage() {
  const { user, org } = await requireOrgAccess();
  const t = await getTranslations('Home');

  return (
    <>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-base text-ink-muted">{t('orgLabel', { name: org.name })}</p>
      <p className="text-base text-ink-muted">
        {t('signedInAs', { name: user.name ?? user.phone })}
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="h-12 rounded-xl border border-line bg-card px-6 text-base font-semibold"
        >
          {t('signOut')}
        </button>
      </form>
    </>
  );
}
