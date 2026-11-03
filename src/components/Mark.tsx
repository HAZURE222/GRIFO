'use client';

import { CSSProperties, useRef } from 'react';
import { useInView } from 'motion/react';
import { Highlighter } from '@/lib/data';

type Props = {
  children: React.ReactNode;
  delay?: number;
  color?: Highlighter;
  className?: string;
};

export function Mark({ children, delay = 0, color, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const style = {
    '--mark-delay': `${delay}ms`,
    ...(color ? { '--mark': `var(--hl-${color})` } : null),
  } as CSSProperties;
  return (
    <span ref={ref} className={`mark ${inView ? 'is-on' : ''} ${className}`} style={style}>
      {children}
    </span>
  );
}
