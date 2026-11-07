import { getTranslations } from 'next-intl/server';
import { LanguageSwitch } from '@/components/language-switch';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const home = await getTranslations('Home');
  const t = await getTranslations('Login');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold">{home('brand')}</span>
        <LanguageSwitch />
      </header>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <LoginForm />
    </main>
  );
}
