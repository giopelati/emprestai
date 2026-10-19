export const USER_ROLES = ['colaborador', 'operacoes'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthenticatedUser {
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginFailureReason =
  | 'invalid_credentials'
  | 'network'
  | 'role_not_configured';

export type LoginAttemptResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: LoginFailureReason };

export function parseUserRole(value: unknown): UserRole | null {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : null;
}
