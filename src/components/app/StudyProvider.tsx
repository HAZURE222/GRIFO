'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { addDays, ISODate, today } from '@/lib/dates';
import { newId } from '@/lib/id';
import { emptySnapshot, Exam, Highlighter, HIGHLIGHTERS, NoteSource, repository, Review, Session, StudySnapshot, Subject, Topic, TopicStatus } from '@/lib/data';
import { REVIEW_INTERVALS } from '@/lib/data/selectors';
import { buildExample } from '@/lib/data/seed';
import { useUI } from './ui';

export type SessionInput = Omit<Session, 'id'>;

type Study = StudySnapshot & {
  status: 'loading' | 'error' | 'ready';
  reload: () => void;
  nextColor: () => Highlighter;
  addSubject: (name: string, color: Highlighter) => Promise<string>;
  updateSubject: (subject: Subject) => Promise<void>;
  removeSubject: (id: string) => Promise<void>;
  createNote: (note: { subjectId: string; title: string; content: string; source: NoteSource }) => Promise<string>;
  saveNote: (note: Topic, patch: Partial<Pick<Topic, 'title' | 'content' | 'subjectId'>>) => Promise<void>;
  setTopicStatus: (topic: Topic, status: TopicStatus) => Promise<void>;
  removeTopic: (id: string) => Promise<void>;
  logSession: (input: SessionInput, scheduleReviews: boolean) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  scheduleReviews: (subjectId: string, topicId: string | null, title: string, from?: ISODate) => Promise<void>;
  completeReview: (review: Review) => Promise<void>;
  undoReview: (review: Review) => Promise<void>;
  postponeReview: (review: Review) => Promise<void>;
  removeReview: (id: string) => Promise<void>;
  addExam: (name: string, date: ISODate) => Promise<void>;
  removeExam: (id: string) => Promise<void>;
  setWeeklyGoal: (minutes: number) => Promise<void>;
  loadExample: () => Promise<void>;
  eraseAll: () => Promise<void>;
};

const StudyContext = createContext<Study | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const { account } = useAuth();
  const { toast } = useUI();
  const userId = account?.id ?? '';
  const [snapshot, setSnapshot] = useState<StudySnapshot>(emptySnapshot);
  const [status, setStatus] = useState<Study['status']>('loading');

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setSnapshot(await repository.load(userId));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(
    async (job: () => Promise<unknown>) => {
      try {
        await job();
        await reload();
      } catch {
        toast('Não consegui salvar. Tente de novo.', 'error');
      }
    },
    [reload, toast],
  );

  const value = useMemo<Study>(() => {
    const reviewsFor = (subjectId: string, topicId: string | null, title: string, from: ISODate): Review[] =>
      REVIEW_INTERVALS.map((intervalDays) => ({
        id: newId(),
        subjectId,
        topicId,
        title,
        intervalDays,
        dueDate: addDays(from, intervalDays),
        doneAt: null,
      }));

    return {
      ...snapshot,
      status,
      reload,
      nextColor: () => {
        const used = snapshot.subjects.map((s) => s.color);
        return HIGHLIGHTERS.find((c) => !used.includes(c)) ?? HIGHLIGHTERS[snapshot.subjects.length % HIGHLIGHTERS.length];
      },
      addSubject: async (name, color) => {
        const id = newId();
        await run(() => repository.upsertSubject(userId, { id, name: name.trim(), color, createdAt: new Date().toISOString() }));
        return id;
      },
      updateSubject: (subject) => run(() => repository.upsertSubject(userId, subject)),
      removeSubject: (id) => run(() => repository.deleteSubject(userId, id)),
      createNote: async ({ subjectId, title, content, source }) => {
        const id = newId();
        const now = new Date().toISOString();
        await run(() => repository.upsertTopic(userId, { id, subjectId, title: title.trim(), status: 'a-estudar', content, source, createdAt: now, updatedAt: now }));
        return id;
      },
      saveNote: (note, patch) => run(() => repository.upsertTopic(userId, { ...note, ...patch, updatedAt: new Date().toISOString() })),
      setTopicStatus: (topic, status) => run(() => repository.upsertTopic(userId, { ...topic, status })),
      removeTopic: (id) => run(() => repository.deleteTopic(userId, id)),
      logSession: (input, schedule) =>
        run(async () => {
          await repository.insertSession(userId, { id: newId(), ...input });
          const topic = snapshot.topics.find((t) => t.id === input.topicId);
          if (topic?.status === 'a-estudar') await repository.upsertTopic(userId, { ...topic, status: 'estudado' });
          if (schedule) {
            const subject = snapshot.subjects.find((s) => s.id === input.subjectId);
            await repository.upsertReviews(userId, reviewsFor(input.subjectId, input.topicId, topic?.title ?? subject?.name ?? 'Revisão', input.date));
          }
        }),
      removeSession: (id) => run(() => repository.deleteSession(userId, id)),
      scheduleReviews: (subjectId, topicId, title, from = today()) =>
        run(() => repository.upsertReviews(userId, reviewsFor(subjectId, topicId, title, from))),
      completeReview: (review) => run(() => repository.upsertReviews(userId, [{ ...review, doneAt: today() }])),
      undoReview: (review) => run(() => repository.upsertReviews(userId, [{ ...review, doneAt: null }])),
      postponeReview: (review) =>
        run(() => {
          const base = review.dueDate < today() ? today() : review.dueDate;
          return repository.upsertReviews(userId, [{ ...review, dueDate: addDays(base, 1) }]);
        }),
      removeReview: (id) => run(() => repository.deleteReview(userId, id)),
      addExam: (name, date) => run(() => repository.upsertExam(userId, { id: newId(), name: name.trim(), date } satisfies Exam)),
      removeExam: (id) => run(() => repository.deleteExam(userId, id)),
      setWeeklyGoal: (minutes) => run(() => repository.updateProfile(userId, { ...snapshot.profile, weeklyGoalMinutes: minutes })),
      loadExample: () => run(() => repository.replaceAll(userId, buildExample(today()))),
      eraseAll: () => run(() => repository.replaceAll(userId, emptySnapshot())),
    };
  }, [snapshot, status, reload, run, userId]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy precisa estar dentro de StudyProvider');
  return ctx;
}
