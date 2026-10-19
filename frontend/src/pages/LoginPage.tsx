import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type {
  LoginAttemptResult,
  LoginCredentials,
} from '../auth/auth-types';
import { Brand } from '../components/Brand';

const STATS = [
  { value: '3', label: 'itens por pessoa' },
  { value: '14', label: 'dias de prazo' },
  { value: '0', label: 'linhas para preencher' },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginPageProps {
  authenticate: (credentials: LoginCredentials) => Promise<LoginAttemptResult>;
  initialMessage?: string | null;
}

type FieldName = keyof LoginCredentials;
type FieldErrors = Partial<Record<FieldName, string>>;

function validateCredentials({ email, password }: LoginCredentials): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = 'Informe seu e-mail.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (!password) {
    errors.password = 'Informe sua senha.';
  }

  return errors;
}

export function LoginPage({
  authenticate,
  initialMessage = null,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMessage) {
      setFormMessage(initialMessage);
    }
  }, [initialMessage]);

  function clearErrorFor(field: FieldName) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
    setFormMessage(null);
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    clearErrorFor('email');
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    clearErrorFor('password');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const credentials = { email: email.trim(), password };
    const errors = validateCredentials(credentials);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormMessage(null);

      if (errors.email) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }

      return;
    }

    setFieldErrors({});
    setFormMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authenticate(credentials);

      if (!result.ok) {
        if (result.reason === 'invalid_credentials') {
          setPassword('');
          setFormMessage('E-mail ou senha inválidos.');
          requestAnimationFrame(() => passwordRef.current?.focus());
        } else if (result.reason === 'role_not_configured') {
          setPassword('');
          setFormMessage(
            'Seu acesso ainda não foi configurado. Fale com Operações.',
          );
        } else {
          setFormMessage('Não foi possível entrar. Tente novamente.');
        }
      }
    } catch {
      setFormMessage('Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-hero" aria-labelledby="login-hero-title">
        <div className="login-hero__top">
          <Brand />
        </div>

        <div className="login-hero__content">
          <p className="eyebrow">Gestão interna de equipamentos</p>
          <h1 id="login-hero-title">
            Equipamentos circulando.
            <span>Controle sem planilha.</span>
          </h1>
          <p className="login-hero__lead">
            Saiba o que está disponível, acompanhe cada empréstimo e devolva
            com clareza — do pedido ao balcão.
          </p>

          <dl className="stats" aria-label="Regras principais do Emprestaí">
            {STATS.map((stat) => (
              <div className="stat" key={stat.label}>
                <dt className="stat__value">{stat.value}</dt>
                <dd className="stat__label">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="login-hero__footer">Operações · TI interno</p>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__content">
          <div className="login-panel__mobile-brand">
            <Brand />
          </div>

          <p className="eyebrow">Acesso ao sistema</p>
          <h2 id="login-title">Entrar</h2>
          <p className="login-panel__lead">
            Use seu e-mail corporativo para continuar.
          </p>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
          >
            <div className={`field${fieldErrors.email ? ' field--error' : ''}`}>
              <label htmlFor="email">E-mail</label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={handleEmailChange}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                disabled={isSubmitting}
              />
              {fieldErrors.email ? (
                <p className="field__error" id="email-error">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div
              className={`field${fieldErrors.password ? ' field--error' : ''}`}
            >
              <label htmlFor="password">Senha</label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={handlePasswordChange}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                disabled={isSubmitting}
              />
              {fieldErrors.password ? (
                <p className="field__error" id="password-error">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {formMessage ? (
              <p className="form-message" role="alert">
                {formMessage}
              </p>
            ) : null}

            <button
              className="button button--primary"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
              {isSubmitting ? (
                <span className="button__loader" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <div className="operations-note">
            <span className="operations-note__line" aria-hidden="true" />
            <p>
              <strong>Acesso de Operações</strong>
              Use o mesmo formulário. Seu perfil define a área de entrada.
            </p>
          </div>

          <p className="privacy-note">
            <span className="privacy-note__indicator" aria-hidden="true" />
            Cada pessoa vê apenas os próprios empréstimos.
          </p>
        </div>
      </section>
    </main>
  );
}
