'use client';

import Link from 'next/link';
import { ArrowClockwise, CalendarPlus, Check, Trash } from '@phosphor-icons/react';
import { diffDays, formatShort, today } from '@/lib/dates';
import { Review } from '@/lib/data';
import { useStudy } from './StudyProvider';
import { Swatch, useUI } from './ui';

export function dueLabel(dueDate: string) {
  const diff = diffDays(dueDate, today());
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'há 1 dia';
  if (diff < 0) return `há ${-diff} dias`;
  return formatShort(dueDate);
}

export function ReviewRow({ review, full = false }: { review: Review; full?: boolean }) {
  const { subjects, completeReview, undoReview, postponeReview, removeReview } = useStudy();
  const { confirm } = useUI();
  const subject = subjects.find((s) => s.id === review.subjectId);
  const late = !review.doneAt && review.dueDate < today();

  return (
    <li className={`rev ${late ? 'is-late' : ''} ${review.doneAt ? 'is-done' : ''}`}>
      {review.doneAt ? (
        <button type="button" className="rev-check is-checked" onClick={() => undoReview(review)} aria-label={`Reabrir revisão de ${review.title}`}>
          <ArrowClockwise weight="bold" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className="rev-check" onClick={() => completeReview(review)} aria-label={`Marcar revisão de ${review.title} como feita`}>
          <Check weight="bold" aria-hidden="true" />
        </button>
      )}
      <div className="rev-main">
        {review.topicId ? (
          <Link href={`/caderno?nota=${review.topicId}`} className="rev-title">
            {review.title}
          </Link>
        ) : (
          <span className="rev-title">{review.title}</span>
        )}
        <span className="rev-meta">
          {subject && <Swatch color={subject.color} />}
          {subject?.name} · {review.intervalDays} {review.intervalDays === 1 ? 'dia' : 'dias'}
        </span>
      </div>
      <span className="rev-due">
        {review.doneAt ? `feita ${formatShort(review.doneAt)}` : dueLabel(review.dueDate)}
      </span>
      {full && !review.doneAt && (
        <button type="button" className="icon-btn" onClick={() => postponeReview(review)} aria-label={`Adiar ${review.title} em 1 dia`} title="Adiar 1 dia">
          <CalendarPlus aria-hidden="true" />
        </button>
      )}
      {full && (
        <button
          type="button"
          className="icon-btn"
          aria-label={`Excluir revisão de ${review.title}`}
          title="Excluir"
          onClick={async () => {
            const ok = await confirm({ title: 'Excluir revisão?', body: `A revisão de ${review.title} sai da sua fila.`, action: 'Excluir' });
            if (ok) removeReview(review.id);
          }}
        >
          <Trash aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
