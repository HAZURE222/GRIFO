'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, Stop } from '@phosphor-icons/react';
import { formatClock } from '@/lib/dates';
import { SessionDialog } from './SessionDialog';
import { useStudy } from './StudyProvider';
import { useTimer } from './TimerProvider';
import { useUI } from './ui';

const TARGETS: { value: number | null; label: string }[] = [
  { value: 25, label: '25 min' },
  { value: 50, label: '50 min' },
  { value: null, label: 'Livre' },
];

export function Bench() {
  const { subjects, topics } = useStudy();
  const timer = useTimer();
  const { confirm } = useUI();
  const [finishing, setFinishing] = useState(false);

  const subjectId = subjects.some((s) => s.id === timer.subjectId) ? timer.subjectId : subjects[0]?.id ?? '';
  const ownTopics = topics.filter((t) => t.subjectId === subjectId);
  const topicId = ownTopics.some((t) => t.id === timer.topicId) ? timer.topicId : '';
  const subject = subjects.find((s) => s.id === subjectId);

  const targetMs = timer.targetMinutes ? timer.targetMinutes * 60_000 : 0;
  const progress = targetMs ? Math.min(1, timer.elapsedMs / targetMs) : 0;
  const reached = targetMs > 0 && timer.elapsedMs >= targetMs;

  useEffect(() => {
    const previous = document.title;
    if (timer.running) document.title = `${formatClock(timer.elapsedMs)} · ${subject?.name ?? 'Grifo'}`;
    return () => {
      document.title = previous;
    };
  }, [timer.running, timer.elapsedMs, subject?.name]);

  const finish = () => {
    timer.pause();
    setFinishing(true);
  };

  const discard = async () => {
    const ok = await confirm({
      title: 'Descartar esta sessão?',
      body: `${formatClock(timer.elapsedMs)} de estudo não serão registrados.`,
      action: 'Descartar',
    });
    if (ok) timer.reset();
  };

  return (
    <section className="bench" aria-labelledby="bench-title">
      <header className="bench-head">
        <h2 id="bench-title">Bancada</h2>
        <div className="bench-targets" role="group" aria-label="Duração planejada">
          {TARGETS.map((t) => (
            <button
              key={t.label}
              type="button"
              className={timer.targetMinutes === t.value ? 'is-on' : ''}
              aria-pressed={timer.targetMinutes === t.value}
              onClick={() => timer.configure({ targetMinutes: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="bench-clock" role="timer" aria-label="Tempo da sessão">
        {formatClock(timer.elapsedMs)}
      </div>

      <div className="bench-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="bench-status" aria-live="polite">
        {reached
          ? `Meta de ${timer.targetMinutes} min cumprida. Continue ou conclua.`
          : timer.running
            ? `Estudando ${subject?.name ?? ''}`
            : timer.active
              ? 'Pausado'
              : 'Pronto para começar'}
      </p>

      <div className="bench-controls">
        <label className="bench-select">
          <span>Matéria</span>
          <select value={subjectId} onChange={(e) => timer.configure({ subjectId: e.target.value, topicId: '' })}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bench-select">
          <span>Tópico</span>
          <select value={topicId} onChange={(e) => timer.configure({ subjectId, topicId: e.target.value })}>
            <option value="">Sem tópico</option>
            {ownTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <div className="bench-actions">
          {timer.running ? (
            <button
              type="button"
              className="bench-btn"
              onClick={timer.pause}
            >
              <Pause weight="fill" aria-hidden="true" /> Pausar
            </button>
          ) : (
            <button
              type="button"
              className="bench-btn bench-btn--go"
              onClick={() => {
                timer.configure({ subjectId, topicId });
                timer.start();
              }}
            >
              <Play weight="fill" aria-hidden="true" /> {timer.active ? 'Retomar' : 'Começar'}
            </button>
          )}
          {timer.active && (
            <>
              <button type="button" className="bench-btn" onClick={finish}>
                <Stop weight="fill" aria-hidden="true" /> Concluir
              </button>
              <button type="button" className="bench-btn bench-btn--quiet" onClick={discard}>
                Descartar
              </button>
            </>
          )}
        </div>
      </div>

      {finishing && (
        <SessionDialog
          title="Fechar a sessão"
          initial={{ subjectId, topicId, minutes: Math.max(1, Math.round(timer.elapsedMs / 60_000)) }}
          onClose={() => setFinishing(false)}
          onSaved={timer.reset}
        />
      )}
    </section>
  );
}
