'use client';

import { FormEvent, useState } from 'react';
import { today } from '@/lib/dates';
import { useStudy } from './StudyProvider';
import { Dialog, useUI } from './ui';

type Props = {
  title: string;
  initial?: { subjectId?: string; topicId?: string; minutes?: number };
  onClose: () => void;
  onSaved?: () => void;
};

export function SessionDialog({ title, initial, onClose, onSaved }: Props) {
  const { subjects, topics, logSession } = useStudy();
  const { toast } = useUI();
  const [subjectId, setSubjectId] = useState(initial?.subjectId || subjects[0]?.id || '');
  const [topicId, setTopicId] = useState(initial?.topicId ?? '');
  const [date, setDate] = useState(today());
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 50));
  const [questions, setQuestions] = useState('0');
  const [correct, setCorrect] = useState('0');
  const [note, setNote] = useState('');
  const [schedule, setSchedule] = useState(Boolean(initial?.topicId));
  const [error, setError] = useState<string | null>(null);

  const ownTopics = topics.filter((t) => t.subjectId === subjectId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const m = Number(minutes);
    const q = Number(questions) || 0;
    const c = Number(correct) || 0;
    if (!subjectId) return setError('Escolha uma matéria.');
    if (!Number.isFinite(m) || m < 1) return setError('A sessão precisa ter pelo menos 1 minuto.');
    if (date > today()) return setError('A data da sessão não pode estar no futuro.');
    if (c > q) return setError('Os acertos não podem passar do número de questões.');
    await logSession({ subjectId, topicId: topicId || null, date, minutes: Math.round(m), questions: q, correct: c, note: note.trim() }, schedule);
    toast(schedule ? 'Sessão registrada. Revisões agendadas para 1, 7 e 30 dias.' : 'Sessão registrada.');
    onSaved?.();
    onClose();
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="form-grid">
        <label className="field span-2">
          <span>Matéria</span>
          <select
            className="input"
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId('');
            }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field span-2">
          <span>Tópico (opcional)</span>
          <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Sem tópico</option>
            {ownTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Data</span>
          <input type="date" className="input" value={date} max={today()} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="field">
          <span>Minutos</span>
          <input type="number" inputMode="numeric" min={1} max={1440} className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
        </label>
        <label className="field">
          <span>Questões feitas</span>
          <input type="number" inputMode="numeric" min={0} className="input" value={questions} onChange={(e) => setQuestions(e.target.value)} />
        </label>
        <label className="field">
          <span>Acertos</span>
          <input type="number" inputMode="numeric" min={0} className="input" value={correct} onChange={(e) => setCorrect(e.target.value)} />
        </label>
        <label className="field span-2">
          <span>Anotação (opcional)</span>
          <input className="input" value={note} maxLength={160} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label className="check span-2">
          <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
          Agendar revisões em 1, 7 e 30 dias
        </label>
        {error && (
          <p className="field-error span-2" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions span-2">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Registrar sessão
          </button>
        </div>
      </form>
    </Dialog>
  );
}
