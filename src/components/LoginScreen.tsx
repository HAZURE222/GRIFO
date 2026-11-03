'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import { AuthError } from '@/lib/auth';
import { useAuth } from './AuthProvider';
import { Magnetic, MarkerCursor } from './landing/effects';
import './login.css';

type Mode = 'entrar' | 'criar';

const COPY: Record<Mode, { title: string; action: string; busy: string; swap: string; swapAction: string }> = {
  entrar: {
    title: 'De volta ao caderno.',
    action: 'Entrar',
    busy: 'Entrando…',
    swap: 'Primeira vez aqui?',
    swapAction: 'Criar conta',
  },
  criar: {
    title: 'Comece uma folha nova.',
    action: 'Criar conta',
    busy: 'Criando…',
    swap: 'Já tem conta?',
    swapAction: 'Entrar',
  },
};

export function LoginScreen() {
  const router = useRouter();
  const { account, status, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('entrar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);
  const swapped = useRef(false);
  const copy = COPY[mode];

  useEffect(() => {
    if (swapped.current) firstField.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (status === 'ready' && account && !leaving) router.replace('/caderno');
  }, [status, account, leaving, router]);

  useEffect(() => {
    router.prefetch('/caderno');
  }, [router]);

  const swapMode = () => {
    setMode(mode === 'entrar' ? 'criar' : 'entrar');
    setError(null);
    swapped.current = true;
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setLeaving(true);
      if (mode === 'entrar') await signIn(email, password);
      else await signUp(name, email, password);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => router.replace('/caderno'), reduced ? 0 : 560);
    } catch (err) {
      setLeaving(false);
      setBusy(false);
      setError(err instanceof AuthError ? err.message : 'Não foi possível entrar agora. Tente de novo.');
    }
  }

  return (
    <>
      <MarkerCursor />
      <main id="conteudo" className="login">
        <section className="login-cover" aria-hidden="true">
          <Link href="/" className="wordmark login-back" tabIndex={-1}>
            ← abertura
          </Link>
          <ul className="login-notes">
            <li>Resumir: Leis de Newton</li>
            <li>→ entrou em Física, ligada a [[Cinemática]]</li>
            <li>rever em 7 dias</li>
          </ul>
          <span className="wordmark login-giant">
            gri<span className="login-giant-mark">fo</span>
          </span>
        </section>

        <section className="login-panel">
          <Link href="/" className="wordmark login-mobile-back">
            ← abertura
          </Link>
          <form className="login-form" onSubmit={onSubmit} noValidate={false}>
            <h1 key={mode}>{copy.title}</h1>

            {mode === 'criar' && (
              <div className="field">
                <label htmlFor="nome">Seu nome</label>
                <input ref={firstField} id="nome" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={60} />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                ref={mode === 'entrar' ? firstField : undefined}
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-describedby={error ? 'login-erro' : undefined}
              />
            </div>
            <div className="field">
              <label htmlFor="senha">Senha</label>
              <div className="pass">
                <input
                  id="senha"
                  type={show ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
                  minLength={mode === 'criar' ? 8 : undefined}
                  required
                  aria-describedby={mode === 'criar' ? 'senha-ajuda' : undefined}
                />
                <button type="button" className="pass-toggle" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                  {show ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              {mode === 'criar' && (
                <small id="senha-ajuda" className="login-hint">
                  Pelo menos 8 caracteres.
                </small>
              )}
            </div>

            {error && (
              <p id="login-erro" role="alert" className="field-error">
                {error}
              </p>
            )}

            <div className="login-actions">
              <Magnetic strength={0.2}>
                <button type="submit" className="btn btn--primary login-submit" disabled={busy}>
                  {busy ? copy.busy : copy.action}
                </button>
              </Magnetic>
              <p>
                {copy.swap}{' '}
                <button type="button" className="login-swap" onClick={swapMode}>
                  {copy.swapAction}
                </button>
              </p>
            </div>
          </form>

          <p className="login-local">Sua conta e suas notas ficam só neste navegador.</p>
        </section>
      </main>
      <div className={`login-wipe ${leaving && !error ? 'is-on' : ''}`} aria-hidden="true" />
    </>
  );
}
