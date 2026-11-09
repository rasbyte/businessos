'use client';

import { useTranslations } from 'next-intl';

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('ErrorPage');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-base text-ink-muted">{t('text')}</p>
      <button
        type="button"
        onClick={reset}
        className="h-12 rounded-xl border border-line bg-card px-6 text-base font-semibold"
      >
        {t('retry')}
      </button>
    </div>
  );
}
