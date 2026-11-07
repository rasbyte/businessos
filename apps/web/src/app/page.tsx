import { useTranslations } from 'next-intl';
import { LanguageSwitch } from '@/components/language-switch';

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold">{t('brand')}</span>
        <LanguageSwitch />
      </header>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-base text-ink-muted">{t('subtitle')}</p>
    </main>
  );
}
