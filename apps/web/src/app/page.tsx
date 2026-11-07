import { getTranslations } from 'next-intl/server';
import { LanguageSwitch } from '@/components/language-switch';
import { requireUser } from '@/lib/auth';
import { logoutAction } from './login/actions';

export default async function HomePage() {
  const user = await requireUser();
  const t = await getTranslations('Home');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold">{t('brand')}</span>
        <LanguageSwitch />
      </header>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
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
    </main>
  );
}
