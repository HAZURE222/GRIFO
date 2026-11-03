'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import Lenis from 'lenis';

const finePointer = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

export function Preloader() {
  const [state, setState] = useState<'closed' | 'open' | 'gone'>('closed');

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.pre === 'off') {
      setState('gone');
      return;
    }
    let cancelled = false;
    const minimum = new Promise((r) => setTimeout(r, 750));
    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]);
    Promise.all([minimum, fonts]).then(() => {
      if (cancelled) return;
      setState('open');
      root.dataset.ready = '1';
      try {
        sessionStorage.setItem('grifo:opened', '1');
      } catch {
        /* sem sessionStorage a abertura apenas se repete */
      }
      setTimeout(() => !cancelled && setState('gone'), 900);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'gone') return null;
  return (
    <div className={`pre ${state === 'open' ? 'is-open' : ''}`} aria-hidden="true">
      <div className="pre-door pre-door--top" />
      <div className="pre-door pre-door--bottom" />
      <span className="pre-word wordmark">
        <span className="mark is-on" style={{ '--mark-delay': '120ms' } as React.CSSProperties}>
          grifo
        </span>
      </span>
    </div>
  );
}

export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12 });
    return () => lenis.destroy();
  }, []);
  return null;
}

export function MarkerCursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!finePointer()) return;
    const el = dot.current;
    if (!el) return;
    el.style.display = 'block';
    const target = { x: -100, y: -100, scale: 1 };
    const pos = { x: -100, y: -100, scale: 1 };
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const interactive = (e.target as Element | null)?.closest?.('a, button, input, select, label');
      target.scale = interactive ? 2.1 : 1;
    };
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      pos.scale += (target.scale - pos.scale) * 0.14;
      el.style.transform = `translate3d(${pos.x - 16}px, ${pos.y - 11}px, 0) skewX(-8deg) scale(${pos.scale})`;
      frame = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={dot} className="marker-cursor" aria-hidden="true" />;
}

export function Magnetic({ children, strength = 0.35 }: { children: React.ReactNode; strength?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  return (
    <motion.span
      className="magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !finePointer()) return;
        const box = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - box.left - box.width / 2) * strength);
        y.set((e.clientY - box.top - box.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
