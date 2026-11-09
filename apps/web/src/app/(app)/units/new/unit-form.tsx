'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useActionState, useState, type ReactNode } from 'react';
import { createUnitAction } from './actions';
import type { UnitFormError } from './unit-form-state';

const ERROR_KEYS = {
  invalid: 'invalid',
  duplicate: 'duplicate',
  no_access: 'noAccess',
  unavailable: 'unavailable',
} as const satisfies Record<UnitFormError, string>;

const inputClass = 'h-14 w-full rounded-xl border border-line bg-card px-4 text-xl';

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-semibold">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function UnitForm({ properties }: { properties: Array<{ id: string; name: string }> }) {
  const t = useTranslations('UnitForm');
  const [state, formAction, pending] = useActionState(createUnitAction, {});
  const [type, setType] = useState<'FLAT' | 'SHOP'>('FLAT');
  const values = state.values ?? {};
  const onlyProperty = properties.length === 1 ? properties[0] : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div role="group" aria-label={t('type')} className="grid grid-cols-2 gap-2">
        {(['FLAT', 'SHOP'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={type === option}
            onClick={() => setType(option)}
            className={`h-14 rounded-xl border text-lg font-semibold ${
              type === option ? 'border-brand bg-brand text-white' : 'border-line bg-card'
            }`}
          >
            {t(option === 'FLAT' ? 'flat' : 'shop')}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      {onlyProperty ? (
        <>
          <input type="hidden" name="propertyId" value={onlyProperty.id} />
          <p className="text-base text-ink-muted">
            {t('property')}: {onlyProperty.name}
          </p>
        </>
      ) : (
        <Field id="propertyId" label={t('property')}>
          <select
            id="propertyId"
            name="propertyId"
            defaultValue={values['propertyId']}
            className={inputClass}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field id="number" label={t('number')} hint={t('numberHint')}>
        <input
          id="number"
          name="number"
          type="text"
          required
          maxLength={20}
          defaultValue={values['number']}
          className={inputClass}
        />
      </Field>

      <Field id="floor" label={t('floor')}>
        <input
          id="floor"
          name="floor"
          type="text"
          maxLength={20}
          defaultValue={values['floor']}
          className={inputClass}
        />
      </Field>

      <Field id="areaSqft" label={t('area')}>
        <input
          id="areaSqft"
          name="areaSqft"
          type="text"
          inputMode="numeric"
          defaultValue={values['areaSqft']}
          className={inputClass}
        />
      </Field>

      {type === 'FLAT' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field id="bedrooms" label={t('bedrooms')}>
            <input
              id="bedrooms"
              name="bedrooms"
              type="text"
              inputMode="numeric"
              defaultValue={values['bedrooms']}
              className={inputClass}
            />
          </Field>
          <Field id="bathrooms" label={t('bathrooms')}>
            <input
              id="bathrooms"
              name="bathrooms"
              type="text"
              inputMode="numeric"
              defaultValue={values['bathrooms']}
              className={inputClass}
            />
          </Field>
        </div>
      ) : (
        <Field id="shopCategory" label={t('category')} hint={t('categoryHint')}>
          <input
            id="shopCategory"
            name="shopCategory"
            type="text"
            maxLength={60}
            defaultValue={values['shopCategory']}
            className={inputClass}
          />
        </Field>
      )}

      {state.error ? (
        <p role="alert" className="text-base font-semibold text-danger">
          {t(`errors.${ERROR_KEYS[state.error]}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-14 w-full rounded-xl bg-brand text-lg font-semibold text-white disabled:opacity-60"
      >
        {t('save')}
      </button>
      <Link
        href="/units"
        className="flex h-12 w-full items-center justify-center rounded-xl border border-line bg-card text-base font-semibold"
      >
        {t('cancel')}
      </Link>
    </form>
  );
}
