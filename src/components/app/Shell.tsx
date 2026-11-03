'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { BookOpenText, ChartBar, FlagBanner, GearSix, Repeat, Sun } from '@phosphor-icons/react';
import { useAuth } from '@/components/AuthProvider';
import { formatClock, today } from '@/lib/dates';
import { StudyProvider, useStudy } from './StudyProvider';
import { TimerProvider, useTimer } from './TimerProvider';
import { UIProvider } from './ui';
import './app.css';

const LINKS = [
  { href: '/caderno', label: 'Caderno', Icon: BookOpenText },
  { href: '/hoje', label: 'Hoje', Icon: Sun },
  { href: '/revisoes', label: 'Revisões', Icon: Repeat },
  { href: '/historico', label: 'Histórico', Icon: ChartBar },
  { href: '/provas', label: 'Provas', Icon: FlagBanner },
];

function useLateReviews() {
  const { reviews } = useStudy();
  const day = today();
  return reviews.filter((r) => !r.doneAt && r.dueDate < day).length;
}

function TimerPill() {
  const timer = useTimer();
  const pathname = usePathname();
  if (!timer.active || pathname === '/hoje') return null;
  return (
    <Link href="/hoje" className={`timer-pill ${timer.running ? 'is-running' : ''}`} aria-label={`Sessão em andamento: ${formatClock(timer.elapsedMs)}. Voltar à bancada.`}>
      {formatClock(timer.elapsedMs)}
    </Link>
  );
}

function TopBar() {
  const pathname = usePathname();
  const late = useLateReviews();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > 96);
  });

  return (
    <header className={`topbar ${hidden ? 'is-hidden' : ''}`}>
      <Link href="/caderno" className="wordmark topbar-mark">
        grifo
      </Link>
      <nav aria-label="Painel" className="topbar-nav">
        {LINKS.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <Link key={href} href={href} className={`tab ${current ? 'is-current' : ''}`} aria-current={current ? 'page' : undefined}>
              {label}
              {href === '/revisoes' && late > 0 && (
                <span className="tab-late" aria-label={`${late} atrasadas`}>
                  {late}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="topbar-end">
        <TimerPill />
        <Link href="/ajustes" className={`icon-btn ${pathname === '/ajustes' ? 'is-current' : ''}`} aria-label="Ajustes e conta" aria-current={pathname === '/ajustes' ? 'page' : undefined}>
          <GearSix aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const late = useLateReviews();
  return (
    <nav aria-label="Painel (móvel)" className="bottomnav">
      {LINKS.map(({ href, label, Icon }) => {
        const current = pathname === href;
        return (
          <Link key={href} href={href} className={current ? 'is-current' : ''} aria-current={current ? 'page' : undefined}>
            <span className="bottomnav-icon">
              <Icon weight={current ? 'fill' : 'regular'} aria-hidden="true" />
              {href === '/revisoes' && late > 0 && <span className="bottomnav-dot" />}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="loading" role="status">
      <span className="wordmark">grifo</span>
      <span className="loading-bar" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function Workspace({ children }: { children: React.ReactNode }) {
  const { status, reload } = useStudy();
  return (
    <>
      <TopBar />
      <main id="conteudo" className="page">
        {status === 'loading' && <Loading label="Abrindo seu caderno" />}
        {status === 'error' && (
          <div className="empty" role="alert">
            <h1>O caderno não abriu.</h1>
            <p>Seus dados não puderam ser lidos agora.</p>
            <button type="button" className="btn" onClick={reload}>
              Tentar de novo
            </button>
          </div>
        )}
        {status === 'ready' && children}
      </main>
      <BottomNav />
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { account, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'ready' && !account) router.replace('/entrar');
  }, [status, account, router]);

  if (status === 'loading' || !account) return <Loading label="Verificando sua sessão" />;

  return (
    <UIProvider>
      <StudyProvider>
        <TimerProvider>
          <Workspace>{children}</Workspace>
        </TimerProvider>
      </StudyProvider>
    </UIProvider>
  );
}
