import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { BottomNav } from '@/components/bottom-nav';
import { LanguageSwitch } from '@/components/language-switch';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('Home');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between p-4">
        <span className="text-xl font-bold">{t('brand')}</span>
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
