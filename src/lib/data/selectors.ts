import { addDays, diffDays, ISODate, startOfWeek } from '../dates';
import { Exam, Review, Session, StudySnapshot, Subject } from './types';

export const REVIEW_INTERVALS = [1, 7, 30];

export function minutesByDay(sessions: Session[]): Map<ISODate, number> {
  const map = new Map<ISODate, number>();
  for (const s of sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.minutes);
  return map;
}

export function weekSessions(sessions: Session[], day: ISODate): Session[] {
  const from = startOfWeek(day);
  const to = addDays(from, 6);
  return sessions.filter((s) => s.date >= from && s.date <= to);
}

export type SubjectMinutes = { subject: Subject; minutes: number };

export function minutesBySubject(sessions: Session[], subjects: Subject[]): SubjectMinutes[] {
  return subjects
    .map((subject) => ({
      subject,
      minutes: sessions.filter((s) => s.subjectId === subject.id).reduce((t, s) => t + s.minutes, 0),
    }))
    .filter((x) => x.minutes > 0);
}

export function streak(sessions: Session[], day: ISODate): number {
  const days = new Set(sessions.map((s) => s.date));
  let cursor = days.has(day) ? day : addDays(day, -1);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export type ReviewBuckets = { late: Review[]; today: Review[]; week: Review[]; later: Review[]; done: Review[] };

export function bucketReviews(reviews: Review[], day: ISODate): ReviewBuckets {
  const buckets: ReviewBuckets = { late: [], today: [], week: [], later: [], done: [] };
  const sorted = [...reviews].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const r of sorted) {
    if (r.doneAt) buckets.done.push(r);
    else if (r.dueDate < day) buckets.late.push(r);
    else if (r.dueDate === day) buckets.today.push(r);
    else if (diffDays(r.dueDate, day) <= 7) buckets.week.push(r);
    else buckets.later.push(r);
  }
  buckets.done.reverse();
  return buckets;
}

export function nextExam(exams: Exam[], day: ISODate): Exam | null {
  return [...exams].filter((e) => e.date >= day).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

export type SubjectAccuracy = { subject: Subject; questions: number; correct: number; rate: number };

export function accuracyBySubject({ sessions, subjects }: StudySnapshot): SubjectAccuracy[] {
  return subjects
    .map((subject) => {
      const own = sessions.filter((s) => s.subjectId === subject.id);
      const questions = own.reduce((t, s) => t + s.questions, 0);
      const correct = own.reduce((t, s) => t + s.correct, 0);
      return { subject, questions, correct, rate: questions ? correct / questions : 0 };
    })
    .filter((x) => x.questions > 0)
    .sort((a, b) => a.rate - b.rate);
}
