'use client';

import { createContext, PointerEvent as ReactPointerEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { WarningCircle, X } from '@phosphor-icons/react';
import { Highlighter, HIGHLIGHTERS } from '@/lib/data';

type ToastTone = 'info' | 'error';
type ConfirmRequest = { title: string; body: string; action: string };
type TipData = { title: string; value: string; x: number; y: number };

type UI = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  showTip: (tip: TipData) => void;
  hideTip: () => void;
};

const UIContext = createContext<UI | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToast] = useState<{ message: string; tone: ToastTone; id: number } | null>(null);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [tip, setTip] = useState<TipData | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    if (!toastState) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toastState]);

  const answer = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setRequest(null);
  };

  const value = useMemo<UI>(
    () => ({
      toast: (message, tone = 'info') => setToast({ message, tone, id: Date.now() }),
      confirm: (next) =>
        new Promise((resolve) => {
          resolver.current = resolve;
          setRequest(next);
        }),
      showTip: setTip,
      hideTip: () => setTip(null),
    }),
    [],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      <div className="toast-slot" role="status" aria-live="polite">
        {toastState && (
          <p key={toastState.id} className={`toast toast--${toastState.tone}`}>
            {toastState.tone === 'error' && <WarningCircle weight="bold" aria-hidden="true" />}
            {toastState.message}
          </p>
        )}
      </div>
      {tip && (
        <div className="chart-tip" style={{ transform: `translate3d(${tip.x + 14}px, ${tip.y - 44}px, 0)` }} aria-hidden="true">
          <strong>{tip.value}</strong>
          <span>{tip.title}</span>
        </div>
      )}
      {request && (
        <Dialog title={request.title} onClose={() => answer(false)}>
          <p className="dialog-body">{request.body}</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn--quiet" onClick={() => answer(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--danger" onClick={() => answer(true)}>
              {request.action}
            </button>
          </div>
        </Dialog>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI precisa estar dentro de UIProvider');
  return ctx;
}

export function useTipHandlers(title: string, value: string) {
  const { showTip, hideTip } = useUI();
  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => showTip({ title, value, x: e.clientX, y: e.clientY }),
    [showTip, title, value],
  );
  return { onPointerMove, onPointerLeave: hideTip };
}

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-inner">
        <header className="dialog-head">
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function Swatch({ color }: { color: Highlighter }) {
  return <span className="swatch" style={{ background: `var(--hl-${color})` }} aria-hidden="true" />;
}

const COLOR_NAMES: Record<Highlighter, string> = {
  amarelo: 'Amarelo',
  rosa: 'Rosa',
  laranja: 'Laranja',
  turquesa: 'Turquesa',
  azul: 'Azul',
  verde: 'Verde',
};

export function ColorPicker({ value, onChange, name }: { value: Highlighter; onChange: (c: Highlighter) => void; name: string }) {
  return (
    <fieldset className="color-picker">
      <legend>Cor do marca-texto</legend>
      <div>
        {HIGHLIGHTERS.map((color) => (
          <label key={color} className="color-opt" style={{ background: `var(--hl-${color})` }} title={COLOR_NAMES[color]}>
            <input type="radio" name={name} className="sr-only" checked={value === color} onChange={() => onChange(color)} />
            <span className="sr-only">{COLOR_NAMES[color]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PageHead({ title, aside, children }: { title: string; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {aside && <div className="page-head-aside">{aside}</div>}
    </header>
  );
}
