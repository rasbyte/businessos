'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { requestCodeAction, verifyCodeAction } from './actions';
import type { LoginError } from './login-state';

const ERROR_KEYS = {
  invalid_phone: 'invalidPhone',
  invalid_code: 'invalidCode',
  too_many: 'tooMany',
  unavailable: 'unavailable',
} as const satisfies Record<LoginError, string>;

const inputClass = 'h-14 w-full rounded-xl border border-line bg-card px-4 text-xl';
const buttonClass =
  'h-14 w-full rounded-xl bg-brand text-lg font-semibold text-white disabled:opacity-60';

function ErrorMessage({ error }: { error: LoginError | undefined }) {
  const t = useTranslations('Login.errors');
  if (!error) return null;
  return (
    <p role="alert" className="text-base font-semibold text-danger">
      {t(ERROR_KEYS[error])}
    </p>
  );
}

function LoginSteps({ onRestart }: { onRestart: () => void }) {
  const t = useTranslations('Login');
  const [requested, requestAction, requesting] = useActionState(requestCodeAction, {});
  const [verified, verifyAction, verifying] = useActionState(verifyCodeAction, {});
  const phone = requested.phone;

  if (!phone) {
    return (
      <form action={requestAction} className="flex flex-col gap-4">
        <p className="text-base text-ink-muted">{t('subtitle')}</p>
        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="text-base font-semibold">
            {t('phoneLabel')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={inputClass}
          />
          <p className="text-sm text-ink-muted">{t('phoneHint')}</p>
        </div>
        <ErrorMessage error={requested.error} />
        <button type="submit" disabled={requesting} className={buttonClass}>
          {t('sendCode')}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-4">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-base text-ink-muted">{t('codeSent', { phone })}</p>
      <div className="flex flex-col gap-2">
        <label htmlFor="code" className="text-base font-semibold">
          {t('codeLabel')}
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={16}
          required
          autoFocus
          className={`${inputClass} tracking-widest`}
        />
      </div>
      <ErrorMessage error={verified.error} />
      <button type="submit" disabled={verifying} className={buttonClass}>
        {t('verify')}
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="h-12 w-full rounded-xl border border-line bg-card text-base font-semibold"
      >
        {t('changeNumber')}
      </button>
    </form>
  );
}

export function LoginForm() {
  const [attempt, setAttempt] = useState(0);
  return <LoginSteps key={attempt} onRestart={() => setAttempt((count) => count + 1)} />;
}
