import type { AuthenticatedUser, UserRole } from '../auth/auth-types';
import { Brand } from './Brand';

interface NavigationItem {
  id: string;
  label: string;
}

const NAVIGATION: Record<UserRole, readonly NavigationItem[]> = {
  colaborador: [
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'meus', label: 'Meus empréstimos' },
  ],
  operacoes: [
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'operacoes', label: 'Operações' },
    { id: 'equipamentos', label: 'Equipamentos' },
    { id: 'meus', label: 'Meus empréstimos' },
  ],
};

const AREA_CONTENT: Record<
  UserRole,
  { activeItem: string; eyebrow: string; title: string; description: string }
> = {
  colaborador: {
    activeItem: 'catalogo',
    eyebrow: 'Equipamentos internos',
    title: 'Catálogo',
    description:
      'Sua sessão está protegida. O catálogo de equipamentos entra na próxima funcionalidade.',
  },
  operacoes: {
    activeItem: 'operacoes',
    eyebrow: 'Controle operacional',
    title: 'Operações',
    description:
      'Sua sessão de Operações está protegida. A visão de empréstimos entra na funcionalidade correspondente.',
  },
};

interface ProtectedShellProps {
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
  user: AuthenticatedUser;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstInitial = parts[0]?.charAt(0) ?? '';
  const lastInitial = parts.length > 1 ? parts.at(-1)?.charAt(0) : '';
  return `${firstInitial}${lastInitial ?? ''}`.toLocaleUpperCase('pt-BR');
}

export function ProtectedShell({
  isSigningOut,
  onSignOut,
  user,
}: ProtectedShellProps) {
  const area = AREA_CONTENT[user.role];
  const roleLabel = user.role === 'operacoes' ? 'Operações' : 'Colaborador';

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__inner">
          <Brand />

          <nav className="app-nav__links" aria-label="Navegação principal">
            {NAVIGATION[user.role].map((item) => {
              const isActive = item.id === area.activeItem;

              return (
                <span
                  className={`app-nav__item${isActive ? ' app-nav__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  key={item.id}
                >
                  {item.label}
                </span>
              );
            })}
          </nav>

          <div className="app-nav__profile">
            <span className="role-tag">{roleLabel}</span>
            <span className="avatar" aria-hidden="true">
              {getInitials(user.name)}
            </span>
            <span className="profile-name">{user.name}</span>
            <button
              className="sign-out-button"
              type="button"
              onClick={() => void onSignOut()}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className="protected-page">
        <header className="protected-page__header">
          <div>
            <p className="eyebrow">{area.eyebrow}</p>
            <h1>{area.title}</h1>
          </div>
          <span className="session-indicator">
            <span aria-hidden="true" />
            Sessão ativa
          </span>
        </header>

        <section className="protected-placeholder" aria-labelledby="ready-title">
          <p className="protected-placeholder__index">01</p>
          <div>
            <p className="eyebrow">Acesso confirmado</p>
            <h2 id="ready-title">A área está pronta para receber dados.</h2>
            <p>{area.description}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
