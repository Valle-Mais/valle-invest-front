/** Espelho da política da API (src/auth/password.ts): 8+ caracteres, letra e número. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PASSWORD_POLICY_MESSAGE = 'A senha precisa ter ao menos 8 caracteres, com letras e números.';

export function isPasswordValid(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_PATTERN.test(password);
}
