'use client';

import { useMemo } from 'react';
import { addDays, formatMinutes, formatMonth, formatShort, formatWeekday, ISODate, startOfWeek } from '@/lib/dates';
import { Session, Subject } from '@/lib/data';
import { minutesByDay, minutesBySubject, SubjectAccuracy } from '@/lib/data/selectors';
import { Swatch, useTipHandlers } from './ui';

function MeterSegment({ name, color, minutes, share }: { name: string; color: string; minutes: number; share: number }) {
  const tip = useTipHandlers(name, formatMinutes(minutes));
  return <span className="meter-seg" style={{ flexGrow: share, background: `var(--hl-${color})` }} {...tip} />;
}

export function WeekMeter({ sessions, subjects, goal }: { sessions: Session[]; subjects: Subject[]; goal: number }) {
  const rows = minutesBySubject(sessions, subjects);
  const total = rows.reduce((t, r) => t + r.minutes, 0);
  const scale = Math.max(goal, total);
  const missing = Math.max(0, scale - total);
  return (
    <figure className="meter">
      <figcaption className="sr-only">
        {formatMinutes(total)} estudadas de {formatMinutes(goal)} previstas na semana.
      </figcaption>
      <div className="meter-track" aria-hidden="true">
        {rows.map((r) => (
          <MeterSegment key={r.subject.id} name={r.subject.name} color={r.subject.color} minutes={r.minutes} share={r.minutes} />
        ))}
        {missing > 0 && <span className="meter-rest" style={{ flexGrow: missing }} />}
      </div>
      {rows.length > 0 && (
        <ul className="legend">
          {rows.map((r) => (
            <li key={r.subject.id}>
              <Swatch color={r.subject.color} />
              {r.subject.name}
              <b>{formatMinutes(r.minutes)}</b>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

function DayColumn({ day, minutes, max, isToday, showValue }: { day: ISODate; minutes: number; max: number; isToday: boolean; showValue: boolean }) {
  const tip = useTipHandlers(formatShort(day), minutes ? formatMinutes(minutes) : 'sem estudo');
  const height = max ? (minutes / max) * 100 : 0;
  return (
    <li className={`day ${isToday ? 'is-today' : ''}`} {...tip}>
      <div className="day-plot">
        {showValue && minutes > 0 && <span className="day-value" style={{ bottom: `${height}%` }}>{formatMinutes(minutes)}</span>}
        {minutes > 0 && <span className="day-bar" style={{ height: `${Math.max(height, 3)}%` }} />}
      </div>
      <span className="day-label">{formatWeekday(day)}</span>
      <span className="sr-only">{minutes ? formatMinutes(minutes) : 'sem estudo'}</span>
    </li>
  );
}

export function WeekDays({ sessions, day }: { sessions: Session[]; day: ISODate }) {
  const byDay = minutesByDay(sessions);
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(day), i));
  const values = days.map((d) => byDay.get(d) ?? 0);
  const max = Math.max(...values);
  return (
    <ol className="days" aria-label="Minutos estudados por dia nesta semana">
      {days.map((d, i) => (
        <DayColumn key={d} day={d} minutes={values[i]} max={max} isToday={d === day} showValue={values[i] === max || d === day} />
      ))}
    </ol>
  );
}

const WEEKS = 20;

function HeatCell({ day, minutes, level }: { day: ISODate; minutes: number; level: number }) {
  const tip = useTipHandlers(formatShort(day), minutes ? formatMinutes(minutes) : 'sem estudo');
  return <span className="heat-cell" style={{ background: `var(--seq-${level})` }} {...tip} />;
}

function levelFor(minutes: number) {
  if (minutes <= 0) return 0;
  if (minutes < 45) return 1;
  if (minutes < 90) return 2;
  if (minutes < 150) return 3;
  return 4;
}

export function Heatmap({ sessions, day }: { sessions: Session[]; day: ISODate }) {
  const byDay = useMemo(() => minutesByDay(sessions), [sessions]);
  const first = addDays(startOfWeek(day), -7 * (WEEKS - 1));
  const weeks = Array.from({ length: WEEKS }, (_, w) => {
    const days = Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d));
    return { start: days[0], days, minutes: days.reduce((t, d) => t + (byDay.get(d) ?? 0), 0) };
  });

  return (
    <figure className="heat">
      <div className="heat-grid-wrap" aria-hidden="true">
        <div className="heat-months">
          {weeks.map((w, i) => {
            const month = formatMonth(w.start);
            const changed = i === 0 || month !== formatMonth(weeks[i - 1].start);
            return <span key={w.start}>{changed && i < WEEKS - 1 ? month : ''}</span>;
          })}
        </div>
        <div className="heat-grid">
          {weeks.flatMap((w) =>
            w.days.map((d) =>
              d > day ? (
                <span key={d} className="heat-cell heat-cell--future" />
              ) : (
                <HeatCell key={d} day={d} minutes={byDay.get(d) ?? 0} level={levelFor(byDay.get(d) ?? 0)} />
              ),
            ),
          )}
        </div>
      </div>
      <figcaption className="heat-scale">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="heat-cell" style={{ background: `var(--seq-${l})` }} aria-hidden="true" />
        ))}
        <span>Mais</span>
      </figcaption>
      <details className="data-table">
        <summary>Ver como tabela</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Semana de</th>
              <th scope="col" className="num">
                Tempo
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks
              .filter((w) => w.minutes > 0)
              .reverse()
              .map((w) => (
                <tr key={w.start}>
                  <td>{formatShort(w.start)}</td>
                  <td className="num">{formatMinutes(w.minutes)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function AccuracyRow({ row }: { row: SubjectAccuracy }) {
  const percent = Math.round(row.rate * 100);
  const tip = useTipHandlers(row.subject.name, `${row.correct} de ${row.questions} questões`);
  return (
    <li className="acc-row" {...tip}>
      <span className="acc-name">{row.subject.name}</span>
      <span className="acc-plot">
        <span className="acc-bar" style={{ width: `calc((100% - 48px) * ${Math.max(percent, 1) / 100})`, background: `var(--hl-${row.subject.color})` }} />
        <b className="acc-value">{percent}%</b>
      </span>
      <span className="acc-count">{row.questions} questões</span>
    </li>
  );
}

export function AccuracyBars({ rows }: { rows: SubjectAccuracy[] }) {
  return (
    <ol className="acc" aria-label="Aproveitamento em questões por matéria, do menor para o maior">
      {rows.map((row) => (
        <AccuracyRow key={row.subject.id} row={row} />
      ))}
    </ol>
  );
}
