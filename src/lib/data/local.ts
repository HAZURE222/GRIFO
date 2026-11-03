import { readJSON, writeJSON } from '../storage';
import { emptySnapshot, StudyRepository, StudySnapshot } from './types';

const key = (userId: string) => `grifo:data:${userId}`;

function read(userId: string): StudySnapshot {
  const snapshot = { ...emptySnapshot(), ...readJSON<Partial<StudySnapshot>>(key(userId), {}) };
  const topics = snapshot.topics.map((t) => ({ ...t, content: t.content ?? '', source: t.source ?? 'manual', updatedAt: t.updatedAt ?? t.createdAt }));
  return { ...snapshot, topics };
}

function change(userId: string, fn: (s: StudySnapshot) => StudySnapshot) {
  writeJSON(key(userId), fn(read(userId)));
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

export const localRepository: StudyRepository = {
  async load(userId) {
    return read(userId);
  },
  async upsertSubject(userId, subject) {
    change(userId, (s) => ({ ...s, subjects: upsert(s.subjects, subject) }));
  },
  async deleteSubject(userId, id) {
    change(userId, (s) => ({
      ...s,
      subjects: s.subjects.filter((x) => x.id !== id),
      topics: s.topics.filter((x) => x.subjectId !== id),
      sessions: s.sessions.filter((x) => x.subjectId !== id),
      reviews: s.reviews.filter((x) => x.subjectId !== id),
    }));
  },
  async upsertTopic(userId, topic) {
    change(userId, (s) => ({ ...s, topics: upsert(s.topics, topic) }));
  },
  async deleteTopic(userId, id) {
    change(userId, (s) => ({
      ...s,
      topics: s.topics.filter((x) => x.id !== id),
      sessions: s.sessions.map((x) => (x.topicId === id ? { ...x, topicId: null } : x)),
      reviews: s.reviews.filter((x) => x.topicId !== id),
    }));
  },
  async insertSession(userId, session) {
    change(userId, (s) => ({ ...s, sessions: [...s.sessions, session] }));
  },
  async deleteSession(userId, id) {
    change(userId, (s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
  },
  async upsertReviews(userId, reviews) {
    change(userId, (s) => ({ ...s, reviews: reviews.reduce(upsert, s.reviews) }));
  },
  async deleteReview(userId, id) {
    change(userId, (s) => ({ ...s, reviews: s.reviews.filter((x) => x.id !== id) }));
  },
  async upsertExam(userId, exam) {
    change(userId, (s) => ({ ...s, exams: upsert(s.exams, exam) }));
  },
  async deleteExam(userId, id) {
    change(userId, (s) => ({ ...s, exams: s.exams.filter((x) => x.id !== id) }));
  },
  async updateProfile(userId, profile) {
    change(userId, (s) => ({ ...s, profile }));
  },
  async replaceAll(userId, snapshot) {
    writeJSON(key(userId), snapshot);
  },
};
