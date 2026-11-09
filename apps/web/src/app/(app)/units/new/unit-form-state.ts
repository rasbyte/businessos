export type UnitFormError = 'invalid' | 'duplicate' | 'no_access' | 'unavailable';

export interface UnitFormState {
  error?: UnitFormError;
  /** What the person typed, so the form can be shown again after an error. */
  values?: Record<string, string>;
}
