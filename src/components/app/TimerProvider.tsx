'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { readJSON, writeJSON } from '@/lib/storage';

export type TimerState = {
  subjectId: string;
  topicId: string;
  targetMinutes: number | null;
  startedAt: number | null;
  accumulatedMs: number;
};

const INITIAL: TimerState = { subjectId: '', topicId: '', targetMinutes: 25, startedAt: null, accumulatedMs: 0 };

type Timer = TimerState & {
  elapsedMs: number;
  running: boolean;
  active: boolean;
  configure: (patch: Partial<Pick<TimerState, 'subjectId' | 'topicId' | 'targetMinutes'>>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

const TimerContext = createContext<Timer | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { account } = useAuth();
  const storageKey = `grifo:timer:${account?.id ?? 'anon'}`;
  const [state, setState] = useState<TimerState>(INITIAL);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setState(readJSON(storageKey, INITIAL));
    setNow(Date.now());
  }, [storageKey]);

  const update = useCallback(
    (fn: (s: TimerState) => TimerState) => {
      setState((previous) => {
        const next = fn(previous);
        try {
          writeJSON(storageKey, next);
        } catch {
          /* sem armazenamento, o cronômetro segue só nesta aba */
        }
        return next;
      });
    },
    [storageKey],
  );

  const running = state.startedAt !== null;
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedMs = state.accumulatedMs + (state.startedAt !== null ? Math.max(0, now - state.startedAt) : 0);

  const value = useMemo<Timer>(
    () => ({
      ...state,
      elapsedMs,
      running,
      active: running || state.accumulatedMs > 0,
      configure: (patch) => update((s) => ({ ...s, ...patch })),
      start: () => update((s) => (s.startedAt === null ? { ...s, startedAt: Date.now() } : s)),
      pause: () =>
        update((s) => (s.startedAt === null ? s : { ...s, startedAt: null, accumulatedMs: s.accumulatedMs + (Date.now() - s.startedAt) })),
      reset: () => update((s) => ({ ...s, startedAt: null, accumulatedMs: 0 })),
    }),
    [state, elapsedMs, running, update],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer precisa estar dentro de TimerProvider');
  return ctx;
}
