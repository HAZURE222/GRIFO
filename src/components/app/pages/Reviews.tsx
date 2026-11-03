'use client';

import { WarningCircle } from '@phosphor-icons/react';
import { today } from '@/lib/dates';
import { Review } from '@/lib/data';
import { bucketReviews } from '@/lib/data/selectors';
import { ReviewRow } from '../ReviewRow';
import { useStudy } from '../StudyProvider';
import { PageHead } from '../ui';

function Block({ title, reviews, tone, empty }: { title: string; reviews: Review[]; tone?: 'late'; empty?: string }) {
  if (!reviews.length && !empty) return null;
  return (
    <section className={`rev-block ${tone === 'late' ? 'rev-block--late' : ''}`}>
      <header>
        <h2>
          {tone === 'late' && <WarningCircle weight="bold" aria-hidden="true" />}
          {title}
        </h2>
        <span className="rev-count">{reviews.length}</span>
      </header>
      {reviews.length ? (
        <ul className="rev-list">
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} full />
          ))}
        </ul>
      ) : (
        <p className="quiet-note">{empty}</p>
      )}
    </section>
  );
}

export function ReviewsPage() {
  const { reviews } = useStudy();
  const buckets = bucketReviews(reviews, today());
  return (
    <>
      <PageHead title="Revisões">
        Voltar ao assunto em 1, 7 e 30 dias. Elas nascem quando você fecha uma sessão ou agenda um tópico.
      </PageHead>
      {reviews.length === 0 ? (
        <p className="quiet-note">Nenhuma revisão agendada. Na próxima sessão, deixe marcada a opção de agendar.</p>
      ) : (
        <div className="rev-columns">
          <div>
            <Block title="Atrasadas" reviews={buckets.late} tone="late" />
            <Block title="Hoje" reviews={buckets.today} empty="Nada para hoje." />
          </div>
          <div>
            <Block title="Próximos 7 dias" reviews={buckets.week} empty="Nada nos próximos dias." />
            <Block title="Depois" reviews={buckets.later} />
            <Block title="Feitas" reviews={buckets.done} />
          </div>
        </div>
      )}
    </>
  );
}
