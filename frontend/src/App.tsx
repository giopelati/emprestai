import { useAuth } from './auth/AuthContext';
import { Brand } from './components/Brand';
import { ProtectedShell } from './components/ProtectedShell';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const {
    authenticate,
    isSigningOut,
    notice,
    signOut,
    status,
    user,
  } = useAuth();

  if (status === 'restoring') {
    return (
      <main className="session-loading" aria-live="polite" aria-busy="true">
        <Brand />
        <span className="session-loading__indicator" aria-hidden="true" />
        <p>Restaurando seu acesso...</p>
      </main>
    );
  }

  if (status === 'authenticated' && user) {
    return (
      <ProtectedShell
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        user={user}
      />
    );
  }

  return <LoginPage authenticate={authenticate} initialMessage={notice} />;
}
