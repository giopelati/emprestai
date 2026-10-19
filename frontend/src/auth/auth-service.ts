import type { User } from '@supabase/supabase-js';

import type {
  AuthenticatedUser,
  LoginAttemptResult,
  LoginCredentials,
} from './auth-types';
import { parseUserRole } from './auth-types';
import { getSupabaseClient } from '../lib/supabase';

function isCredentialError(status: number | undefined): boolean {
  return status === 400 || status === 422;
}

function getDisplayName(user: User): string {
  const metadataName = user.user_metadata.full_name ?? user.user_metadata.name;

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split('@')[0] ?? user.email;
  }

  return 'Pessoa usuária';
}

export function getAuthenticatedUser(
  user: User | null | undefined,
): AuthenticatedUser | null {
  if (!user) {
    return null;
  }

  const role = parseUserRole(user.app_metadata.role);

  if (!role) {
    return null;
  }

  return {
    email: user.email ?? '',
    name: getDisplayName(user),
    role,
  };
}

export async function authenticateWithPassword(
  credentials: LoginCredentials,
): Promise<LoginAttemptResult> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      return {
        ok: false,
        reason: isCredentialError(error.status)
          ? 'invalid_credentials'
          : 'network',
      };
    }

    const user = getAuthenticatedUser(data.user);

    if (!data.session || !user) {
      await supabase.auth.signOut({ scope: 'local' });
      return { ok: false, reason: 'role_not_configured' };
    }

    return { ok: true, user };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
