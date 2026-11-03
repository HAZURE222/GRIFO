'use client';

import { FormEvent, useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { diffDays, formatLong, formatShort, today } from '@/lib/dates';
import { useStudy } from '../StudyProvider';
import { PageHead, useUI } from '../ui';

export function ExamsPage() {
  const { exams, addExam, removeExam } = useStudy();
  const { confirm } = useUI();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const day = today();
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const future = sorted.filter((e) => e.date >= day);
  const past = sorted.filter((e) => e.date < day).reverse();
  const [next, ...rest] = future;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;
    await addExam(name, date);
    setName('');
    setDate('');
  };

  const remove = async (id: string, label: string) => {
    const ok = await confirm({ title: 'Excluir prova?', body: `${label} sai da sua contagem.`, action: 'Excluir' });
    if (ok) removeExam(id);
  };

  return (
    <>
      <PageHead title="Provas" />
      <div className="exams">
        <div className="exams-main">
          {next ? (
            <section className="exam-hero" aria-label="Próxima prova">
              <span className="exam-hero-n">{diffDays(next.date, day)}</span>
              <div>
                <p className="eyebrow">{diffDays(next.date, day) === 1 ? 'dia para' : 'dias para'}</p>
                <h2>{next.name}</h2>
                <p>{formatLong(next.date)}</p>
                <button type="button" className="text-btn text-btn--danger" onClick={() => remove(next.id, next.name)}>
                  Excluir
                </button>
              </div>
            </section>
          ) : (
            <p className="quiet-note">Nenhuma prova marcada. Cadastre a data e ela passa a abrir o seu dia.</p>
          )}
          {rest.length > 0 && (
            <ul className="exam-list">
              {rest.map((e) => (
                <li key={e.id}>
                  <span className="exam-list-n">{diffDays(e.date, day)}d</span>
                  <span className="exam-list-name">{e.name}</span>
                  <span className="mono">{formatShort(e.date)}</span>
                  <button type="button" className="icon-btn" aria-label={`Excluir ${e.name}`} onClick={() => remove(e.id, e.name)}>
                    <Trash aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {past.length > 0 && (
            <details className="data-table">
              <summary>Provas passadas ({past.length})</summary>
              <ul className="exam-list exam-list--past">
                {past.map((e) => (
                  <li key={e.id}>
                    <span className="exam-list-name">{e.name}</span>
                    <span className="mono">{formatShort(e.date)}</span>
                    <button type="button" className="icon-btn" aria-label={`Excluir ${e.name}`} onClick={() => remove(e.id, e.name)}>
                      <Trash aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <form className="exam-form" onSubmit={onSubmit}>
          <h2>Marcar prova</h2>
          <label className="field">
            <span>Nome</span>
            <input className="input" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Data</span>
            <input type="date" className="input" min={day} value={date} required onChange={(e) => setDate(e.target.value)} />
          </label>
          <button type="submit" className="btn">
            Marcar
          </button>
        </form>
      </div>
    </>
  );
}
