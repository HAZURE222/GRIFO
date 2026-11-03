'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, MotionValue, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '@/components/AuthProvider';
import { Magnetic, MarkerCursor, Preloader, SmoothScroll } from './effects';
import './landing.css';

const HEADLINE: { text: string; mark?: boolean }[][] = [
  [{ text: 'Nem' }, { text: 'tudo' }, { text: 'merece' }],
  [{ text: 'ser' }, { text: 'relido.' }],
  [{ text: 'Grife' }, { text: 'o que fica.', mark: true }],
];

const MARGIN_NOTES = [
  { text: '→ ver [[Cinemática]]', speed: -140, className: 'note--a' },
  { text: 'errei 3 de 10. voltar aqui', speed: -260, className: 'note--b' },
  { text: 'cai todo ano?', speed: -90, className: 'note--c' },
];

const PARAGRAPH: { text: string; key?: boolean }[] = [
  { text: 'Você digita o tópico que quer entender. A IA escreve' },
  { text: 'o resumo', key: true },
  { text: 'e ele entra' },
  { text: 'dentro da matéria', key: true },
  { text: 'como uma nota sua: dá para editar, grifar e' },
  { text: 'ligar com outras notas.', key: true },
  { text: 'Com o tempo, o caderno vira um mapa do que você estudou e' },
  { text: 'do que precisa rever.', key: true },
];

const CHAPTERS = [
  {
    n: '01',
    title: 'Peça',
    body: 'Diga o tópico ou cole o seu material. A IA escreve o resumo na hora, com os termos importantes já grifados.',
  },
  {
    n: '02',
    title: 'Organize',
    body: 'O resumo vira uma nota dentro da matéria. Encurte, simplifique ou edite à mão, em Markdown.',
  },
  {
    n: '03',
    title: 'Conecte',
    body: 'Ligue notas com [[links]], como no Obsidian. Veja quem cita quem e abra o mapa do caderno inteiro.',
  },
  {
    n: '04',
    title: 'Fixe',
    body: 'Gere perguntas a partir da nota, agende revisões em 1, 7 e 30 dias e cronometre o estudo até a prova.',
  },
];

function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const { account } = useAuth();
  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > 120);
  });
  return (
    <header className={`l-nav ${hidden ? 'is-hidden' : ''}`}>
      <Link href="/" className="wordmark l-nav-mark">
        grifo
      </Link>
      <nav aria-label="Abertura" className="l-nav-links">
        <a href="#metodo">O método</a>
        <Link href={account ? '/caderno' : '/entrar'} className="l-nav-cta">
          {account ? 'Abrir painel' : 'Entrar'}
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 900], [0, -80]);
  const { account } = useAuth();
  return (
    <section className="hero">
      {MARGIN_NOTES.map((note) => (
        <MarginNote key={note.text} {...note} scrollY={scrollY} />
      ))}
      <motion.h1 className="hero-title" style={{ y: lift }} aria-label="Nem tudo merece ser relido. Grife o que fica.">
        {HEADLINE.map((line, l) => (
          <span className="hero-line" key={l} aria-hidden="true">
            {line.map((word, w) => (
              <span className="word" key={word.text}>
                <span style={{ transitionDelay: `${l * 110 + w * 50}ms` }}>
                  {word.mark ? <span className="mark">{word.text}</span> : word.text}
                </span>
              </span>
            ))}
          </span>
        ))}
      </motion.h1>
      <div className="hero-foot">
        <p>
          Um caderno com IA para quem estuda para prova: peça o resumo de qualquer tópico e ele entra na matéria,
          pronto para editar, ligar a outras notas e revisar.
        </p>
        <Magnetic>
          <Link href={account ? '/caderno' : '/entrar'} className="btn btn--primary hero-cta">
            {account ? 'Abrir o painel' : 'Abrir meu caderno'} <ArrowRight weight="bold" aria-hidden="true" />
          </Link>
        </Magnetic>
      </div>
    </section>
  );
}

function MarginNote({ text, speed, className, scrollY }: { text: string; speed: number; className: string; scrollY: MotionValue<number> }) {
  const y = useTransform(scrollY, [0, 900], [0, speed]);
  return (
    <motion.span className={`note ${className}`} style={{ y }} aria-hidden="true">
      {text}
    </motion.span>
  );
}

function ScrollWord({ word, range, progress, marked }: { word: string; range: [number, number]; progress: MotionValue<number>; marked: boolean }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const scaleX = useTransform(progress, range, [0, 1]);
  return (
    <motion.span className={`sw ${marked ? 'sw--key' : ''}`} style={{ opacity }}>
      {marked && <motion.span className="sw-bg" style={{ scaleX, skewX: -5 }} />}
      <span className="sw-text">{word}</span>{' '}
    </motion.span>
  );
}

function HighlightParagraph() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const words = PARAGRAPH.flatMap((part) => part.text.split(' ').map((word) => ({ word, key: !!part.key })));
  return (
    <section ref={ref} className="pin" aria-label="Por que grifar">
      <div className="pin-sticky">
        <p className="pin-text sr-only">{PARAGRAPH.map((p) => p.text).join(' ')}</p>
        <p className="pin-text" aria-hidden="true">
          {words.map(({ word, key }, i) => {
            const start = 0.04 + (i / words.length) * 0.84;
            return <ScrollWord key={i} word={word} marked={key} progress={scrollYProgress} range={[start, start + 0.05]} />;
          })}
        </p>
      </div>
    </section>
  );
}

function HorizontalChapters() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.02, 0.98], ['0vw', '-210vw']);
  return (
    <section ref={ref} id="metodo" className="hz" aria-label="O método">
      <div className="hz-sticky">
        <span className="eyebrow hz-label">O método, em quatro folhas</span>
        <motion.ol className="hz-track" style={{ x }}>
          {CHAPTERS.map((c) => (
            <li className="hz-panel" key={c.n}>
              <span className="hz-n" aria-hidden="true">
                {c.n}
              </span>
              <h2>{c.title}</h2>
              <p>{c.body}</p>
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function Closing() {
  const { account } = useAuth();
  return (
    <section className="closing">
      <h2>
        Abra o<br />
        caderno.
      </h2>
      <Magnetic>
        <Link href={account ? '/caderno' : '/entrar'} className="btn btn--primary hero-cta">
          {account ? 'Ir para o painel' : 'Criar conta ou entrar'} <ArrowRight weight="bold" aria-hidden="true" />
        </Link>
      </Magnetic>
      <span className="wordmark closing-mark" aria-hidden="true">
        grifo
      </span>
    </section>
  );
}

export function Landing() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <MarkerCursor />
      <Nav />
      <main id="conteudo" className="landing">
        <Hero />
        <HighlightParagraph />
        <HorizontalChapters />
        <Closing />
      </main>
    </>
  );
}
