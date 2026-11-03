import { ISODate } from '../dates';

export const HIGHLIGHTERS = ['amarelo', 'rosa', 'laranja', 'turquesa', 'azul', 'verde'] as const;
export type Highlighter = (typeof HIGHLIGHTERS)[number];

export type Subject = { id: string; name: string; color: Highlighter; createdAt: string };

export type NoteSource = 'ia' | 'manual';
export type TopicStatus = 'a-estudar' | 'estudado' | 'dominado';
export type Topic = {
  id: string;
  subjectId: string;
  title: string;
  status: TopicStatus;
  content: string;
  source: NoteSource;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  subjectId: string;
  topicId: string | null;
  date: ISODate;
  minutes: number;
  questions: number;
  correct: number;
  note: string;
};

export type Review = {
  id: string;
  subjectId: string;
  topicId: string | null;
  title: string;
  dueDate: ISODate;
  intervalDays: number;
  doneAt: ISODate | null;
};

export type Exam = { id: string; name: string; date: ISODate };

export type Profile = { weeklyGoalMinutes: number };

export type StudySnapshot = {
  subjects: Subject[];
  topics: Topic[];
  sessions: Session[];
  reviews: Review[];
  exams: Exam[];
  profile: Profile;
};

export const emptySnapshot = (): StudySnapshot => ({
  subjects: [],
  topics: [],
  sessions: [],
  reviews: [],
  exams: [],
  profile: { weeklyGoalMinutes: 600 },
});

export interface StudyRepository {
  load(userId: string): Promise<StudySnapshot>;
  upsertSubject(userId: string, subject: Subject): Promise<void>;
  deleteSubject(userId: string, id: string): Promise<void>;
  upsertTopic(userId: string, topic: Topic): Promise<void>;
  deleteTopic(userId: string, id: string): Promise<void>;
  insertSession(userId: string, session: Session): Promise<void>;
  deleteSession(userId: string, id: string): Promise<void>;
  upsertReviews(userId: string, reviews: Review[]): Promise<void>;
  deleteReview(userId: string, id: string): Promise<void>;
  upsertExam(userId: string, exam: Exam): Promise<void>;
  deleteExam(userId: string, id: string): Promise<void>;
  updateProfile(userId: string, profile: Profile): Promise<void>;
  replaceAll(userId: string, snapshot: StudySnapshot): Promise<void>;
}
