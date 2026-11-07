export type LoginError = 'invalid_phone' | 'invalid_code' | 'too_many' | 'unavailable';

export interface LoginState {
  phone?: string;
  error?: LoginError;
}
