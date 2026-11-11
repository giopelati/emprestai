import { useState } from 'react';

import type { AuthenticatedUser, UserRole } from '../auth/auth-types';
import { CatalogoPage } from '../pages/CatalogoPage';
import { MeusEmprestimosPage } from '../pages/MeusEmprestimosPage';
import { Brand } from './Brand';

type AreaId = 'catalogo' | 'meus' | 'operacoes' | 'equipamentos';

interface NavigationItem {
  id: AreaId;
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

// Spec 001, CA-06: colaborador entra em Catálogo; Operações entra em Operações.
const AREA_INICIAL: Record<UserRole, AreaId> = {
  colaborador: 'catalogo',
  operacoes: 'operacoes',
};

const PLACEHOLDERS: Record<'operacoes' | 'equipamentos', { eyebrow: string; title: string; description: string }> = {
  operacoes: {
    eyebrow: 'Controle operacional',
    title: 'Operações',
    description:
      'Sua sessão de Operações está protegida. A visão de empréstimos entra na funcionalidade correspondente.',
  },
  equipamentos: {
    eyebrow: 'Controle operacional',
    title: 'Equipamentos',
    description: 'O cadastro de equipamentos entra na funcionalidade correspondente.',
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

function Placeholder({ area }: { area: 'operacoes' | 'equipamentos' }) {
  const content = PLACEHOLDERS[area];
  return (
    <main className="protected-page">
      <header className="protected-page__header">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
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
          <p>{content.description}</p>
        </div>
      </section>
    </main>
  );
}

export function ProtectedShell({
  isSigningOut,
  onSignOut,
  user,
}: ProtectedShellProps) {
  const [area, setArea] = useState<AreaId>(AREA_INICIAL[user.role]);
  const roleLabel = user.role === 'operacoes' ? 'Operações' : 'Colaborador';

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__inner">
          <Brand />

          <nav className="app-nav__links" aria-label="Navegação principal">
            {NAVIGATION[user.role].map((item) => {
              const isActive = item.id === area;

              return (
                <button
                  className={`app-nav__item${isActive ? ' app-nav__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  key={item.id}
                  type="button"
                  onClick={() => setArea(item.id)}
                >
                  {item.label}
                </button>
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

      {area === 'catalogo' && <CatalogoPage />}
      {area === 'meus' && <MeusEmprestimosPage onIrAoCatalogo={() => setArea('catalogo')} />}
      {(area === 'operacoes' || area === 'equipamentos') && <Placeholder area={area} />}
    </div>
  );
}
