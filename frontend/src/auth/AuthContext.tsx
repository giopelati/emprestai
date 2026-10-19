import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  authenticateWithPassword,
  getAuthenticatedUser,
} from './auth-service';
import type {
  AuthenticatedUser,
  LoginAttemptResult,
  LoginCredentials,
} from './auth-types';
import { getSupabaseClient } from '../lib/supabase';

type AuthStatus = 'restoring' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthenticatedUser | null;
}

interface AuthContextValue extends AuthState {
  authenticate: (
    credentials: LoginCredentials,
  ) => Promise<LoginAttemptResult>;
  isSigningOut: boolean;
  notice: string | null;
  signOut: () => Promise<void>;
}

const ROLE_NOTICE =
  'Seu acesso ainda não foi configurado. Fale com Operações.';
const OPERATIONAL_NOTICE = 'Não foi possível entrar. Tente novamente.';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'restoring',
    user: null,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isActive = true;
    let latestValidationId = 0;

    try {
      const supabase = getSupabaseClient();

      function discardSession(message: string) {
        if (!isActive) {
          return;
        }

        setNotice(message);
        setAuthState({ status: 'unauthenticated', user: null });
        queueMicrotask(() => {
          void supabase.auth.signOut({ scope: 'local' });
        });
      }

      async function validateSession(session: Session | null) {
        const validationId = ++latestValidationId;

        if (!session) {
          if (isActive) {
            setAuthState({ status: 'unauthenticated', user: null });
          }
          return;
        }

        const { data, error } = await supabase.auth.getUser(
          session.access_token,
        );

        if (!isActive || validationId !== latestValidationId) {
          return;
        }

        if (error || !data.user) {
          discardSession(OPERATIONAL_NOTICE);
          return;
        }

        const user = getAuthenticatedUser(data.user);

        if (!user) {
          discardSession(ROLE_NOTICE);
          return;
        }

        setNotice(null);
        setAuthState({ status: 'authenticated', user });
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        void validateSession(session);
      });

      const initialRequestId = ++latestValidationId;

      void supabase.auth.getSession().then(({ data, error }) => {
        if (!isActive || initialRequestId !== latestValidationId) {
          return;
        }

        if (error) {
          discardSession(OPERATIONAL_NOTICE);
          return;
        }

        void validateSession(data.session);
      });

      return () => {
        isActive = false;
        latestValidationId += 1;
        subscription.unsubscribe();
      };
    } catch {
      setNotice(OPERATIONAL_NOTICE);
      setAuthState({ status: 'unauthenticated', user: null });
      return () => {
        isActive = false;
        latestValidationId += 1;
      };
    }
  }, []);

  const authenticate = useCallback(async (credentials: LoginCredentials) => {
    setNotice(null);
    const result = await authenticateWithPassword(credentials);

    if (result.ok) {
      setAuthState({ status: 'authenticated', user: result.user });
    }

    return result;
  }, []);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // O estado local ainda precisa ser limpo para proteger a interface.
    } finally {
      setNotice(null);
      setAuthState({ status: 'unauthenticated', user: null });
      setIsSigningOut(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      authenticate,
      isSigningOut,
      notice,
      signOut,
    }),
    [authState, authenticate, isSigningOut, notice, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
