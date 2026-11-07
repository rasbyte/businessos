'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { setLocale } from '@/i18n/actions';
import { locales, type Locale } from '@/i18n/config';

const LABELS: Record<Locale, string> = { bn: 'বাংলা', en: 'EN' };

export function LanguageSwitch() {
  const t = useTranslations('Language');
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="inline-flex overflow-hidden rounded-xl border border-line bg-card"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending}
          aria-pressed={current === locale}
          onClick={() => change(locale)}
          className={`h-11 min-w-14 px-4 text-base font-semibold ${
            current === locale ? 'bg-brand text-white' : 'text-ink'
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
