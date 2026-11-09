import { getTranslations } from 'next-intl/server';
import { logoutAction } from '@/app/login/actions';
import { LanguageSwitch } from '@/components/language-switch';

export default async function NoAccessPage() {
  const t = await getTranslations('NoAccess');
  const home = await getTranslations('Home');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold">{home('brand')}</span>
        <LanguageSwitch />
      </header>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-base text-ink-muted">{t('text')}</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="h-12 rounded-xl border border-line bg-card px-6 text-base font-semibold"
        >
          {home('signOut')}
        </button>
      </form>
    </main>
  );
}
