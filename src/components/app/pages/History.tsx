'use client';

import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { formatMinutes, formatShort, today } from '@/lib/dates';
import { accuracyBySubject } from '@/lib/data/selectors';
import { AccuracyBars, Heatmap } from '../charts';
import { SessionDialog } from '../SessionDialog';
import { useStudy } from '../StudyProvider';
import { PageHead, Swatch, useUI } from '../ui';

const PAGE = 25;

export function HistoryPage() {
  const study = useStudy();
  const { subjects, topics, sessions, removeSession } = study;
  const { confirm } = useUI();
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [adding, setAdding] = useState(false);

  const accuracy = accuracyBySubject(study);
  const worst = accuracy[0];
  const rows = [...sessions].filter((s) => !filter || s.subjectId === filter).sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((t, s) => t + s.minutes, 0);

  return (
    <>
      <PageHead
        title="Histórico"
        aside={
          <button type="button" className="btn" disabled={!subjects.length} onClick={() => setAdding(true)}>
            Registrar sessão
          </button>
        }
      >
        {sessions.length ? `${formatMinutes(sessions.reduce((t, s) => t + s.minutes, 0))} em ${sessions.length} ${sessions.length === 1 ? 'sessão' : 'sessões'}.` : 'Suas sessões aparecem aqui.'}
      </PageHead>

      {sessions.length > 0 && (
        <div className="history-top">
          <section aria-labelledby="ponto">
            <header className="section-head">
              <h2 id="ponto">Folha de ponto</h2>
            </header>
            <Heatmap sessions={sessions} day={today()} />
          </section>
          <section aria-labelledby="acc">
            <header className="section-head">
              <h2 id="acc">Aproveitamento em questões</h2>
            </header>
            {accuracy.length ? (
              <>
                {worst && (
                  <p className="acc-lead">
                    Onde a próxima hora rende mais: <b>{worst.subject.name}</b>.
                  </p>
                )}
                <AccuracyBars rows={accuracy} />
              </>
            ) : (
              <p className="quiet-note">Registre questões ao fechar uma sessão para ver o aproveitamento.</p>
            )}
          </section>
        </div>
      )}

      <section aria-labelledby="sessoes" className="sessions">
        <header className="section-head">
          <h2 id="sessoes">Sessões</h2>
          <label className="inline-filter">
            <span>Matéria</span>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setLimit(PAGE);
              }}
            >
              <option value="">Todas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </header>
        {rows.length ? (
          <div className="table-wrap">
            <table className="ledger">
              <caption className="sr-only">Sessões registradas, da mais recente para a mais antiga. Total {formatMinutes(total)}.</caption>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Matéria</th>
                  <th scope="col">Tópico</th>
                  <th scope="col" className="num">
                    Tempo
                  </th>
                  <th scope="col" className="num">
                    Acertos
                  </th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((s) => {
                  const subject = subjects.find((x) => x.id === s.subjectId);
                  const topic = topics.find((x) => x.id === s.topicId);
                  return (
                    <tr key={s.id}>
                      <td className="mono">{formatShort(s.date)}</td>
                      <td>
                        <span className="cell-subject">
                          {subject && <Swatch color={subject.color} />}
                          {subject?.name ?? 'Removida'}
                        </span>
                      </td>
                      <td className="cell-topic">
                        {topic?.title ?? '—'}
                        {s.note && <small>{s.note}</small>}
                      </td>
                      <td className="num">{formatMinutes(s.minutes)}</td>
                      <td className="num">{s.questions ? `${s.correct}/${s.questions}` : '—'}</td>
                      <td className="cell-action">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Excluir sessão de ${formatShort(s.date)}`}
                          onClick={async () => {
                            const ok = await confirm({ title: 'Excluir sessão?', body: `${formatMinutes(s.minutes)} de ${subject?.name ?? 'estudo'} em ${formatShort(s.date)} saem do histórico.`, action: 'Excluir' });
                            if (ok) removeSession(s.id);
                          }}
                        >
                          <Trash aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="quiet-note">{filter ? 'Nenhuma sessão nesta matéria.' : subjects.length ? 'Nenhuma sessão ainda. Ligue o cronômetro em Hoje ou registre uma aqui.' : 'Crie uma matéria para registrar sessões.'}</p>
        )}
        {rows.length > limit && (
          <button type="button" className="btn btn--quiet" onClick={() => setLimit(limit + PAGE)}>
            Mostrar mais {Math.min(PAGE, rows.length - limit)}
          </button>
        )}
      </section>

      {adding && <SessionDialog title="Registrar sessão" onClose={() => setAdding(false)} />}
    </>
  );
}
