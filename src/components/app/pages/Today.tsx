'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Mark } from '@/components/Mark';
import { useAuth } from '@/components/AuthProvider';
import { diffDays, formatLong, formatMinutes, formatShort, today } from '@/lib/dates';
import { bucketReviews, nextExam, streak, weekSessions } from '@/lib/data/selectors';
import { Bench } from '../Bench';
import { Heatmap, WeekDays, WeekMeter } from '../charts';
import { ReviewRow } from '../ReviewRow';
import { useStudy } from '../StudyProvider';
import { BlankNotebook } from '../BlankNotebook';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Headline() {
  const { reviews, exams, sessions } = useStudy();
  const day = today();
  const buckets = bucketReviews(reviews, day);
  const exam = nextExam(exams, day);
  const remaining = exam ? diffDays(exam.date, day) : 0;
  const studiedToday = sessions.filter((s) => s.date === day).reduce((t, s) => t + s.minutes, 0);

  const parts: React.ReactNode[] = [];
  let delay = 200;
  const mark = (text: string, key: string) => {
    const node = (
      <Mark key={key} delay={delay}>
        {text}
      </Mark>
    );
    delay += 260;
    return node;
  };

  if (buckets.late.length) parts.push(<span key="late">Você tem {mark(plural(buckets.late.length, 'revisão atrasada', 'revisões atrasadas'), 'm-late')}</span>);
  if (buckets.today.length) {
    parts.push(
      <span key="today">
        {parts.length ? (exam ? ', ' : ' e ') : 'Você tem '}
        {mark(plural(buckets.today.length, 'revisão', 'revisões'), 'm-today')} para hoje
      </span>,
    );
  }
  if (!parts.length) parts.push(<span key="clear">{studiedToday ? `Já são ${formatMinutes(studiedToday)} hoje` : 'Nada vencido hoje'}</span>);
  if (exam) {
    parts.push(
      <span key="exam">
        {' '}
        e {remaining === 0 ? <>hoje é dia de {mark(exam.name, 'm-exam')}</> : <>faltam {mark(plural(remaining, 'dia', 'dias'), 'm-exam')} para {exam.name}</>}
      </span>,
    );
  }
  return <h1 className="today-headline">{parts}.</h1>;
}

export function TodayPage() {
  const { subjects, sessions, reviews, exams, profile } = useStudy();
  const { account } = useAuth();
  const [day, setDay] = useState('');
  useEffect(() => setDay(today()), []);
  if (!day) return null;
  if (!subjects.length) return <BlankNotebook name={account?.name ?? ''} />;

  const buckets = bucketReviews(reviews, day);
  const queue = [...buckets.late, ...buckets.today].slice(0, 6);
  const queueTotal = buckets.late.length + buckets.today.length;
  const upcoming = buckets.week[0];
  const week = weekSessions(sessions, day);
  const weekMinutes = week.reduce((t, s) => t + s.minutes, 0);
  const days = streak(sessions, day);
  const exam = nextExam(exams, day);

  return (
    <div className="today">
      <div className="today-top">
        <p className="eyebrow">{formatLong(day)}</p>
        <Headline />
      </div>

      <Bench />

      <section className="queue" aria-labelledby="queue-title">
        <header className="section-head">
          <h2 id="queue-title">Fila de revisão</h2>
          <Link href="/revisoes" className="link-more">
            Ver todas <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        {queue.length ? (
          <ul className="rev-list">
            {queue.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </ul>
        ) : (
          <p className="quiet-note">
            Fila limpa.{upcoming ? ` A próxima é ${upcoming.title}, em ${formatShort(upcoming.dueDate)}.` : ' Conclua uma sessão para agendar revisões.'}
          </p>
        )}
        {queueTotal > queue.length && <p className="quiet-note">e mais {queueTotal - queue.length} na fila.</p>}
      </section>

      <section className="week" aria-labelledby="week-title">
        <header className="week-head">
          <h2 id="week-title">Esta semana</h2>
          <p className="week-figure">
            {formatMinutes(weekMinutes)}
            <small> de {formatMinutes(profile.weeklyGoalMinutes)}</small>
          </p>
          <p className="week-side">{days > 0 ? `${plural(days, 'dia seguido', 'dias seguidos')} estudando` : 'Nenhuma sessão ontem nem hoje'}</p>
        </header>
        <WeekMeter sessions={week} subjects={subjects} goal={profile.weeklyGoalMinutes} />
        <WeekDays sessions={week} day={day} />
      </section>

      <section className="sheet" aria-labelledby="sheet-title">
        <header className="section-head">
          <h2 id="sheet-title">Folha de ponto</h2>
          <span className="eyebrow">últimas 20 semanas</span>
        </header>
        <Heatmap sessions={sessions} day={day} />
      </section>

      {exam && (
        <Link href="/provas" className="exam-strip">
          <span className="exam-strip-n">{diffDays(exam.date, day)}</span>
          <span>
            <b>{diffDays(exam.date, day) === 1 ? 'dia' : 'dias'} para {exam.name}</b>
            <small>{formatLong(exam.date)}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
