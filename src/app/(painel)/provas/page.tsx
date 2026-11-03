import type { Metadata } from 'next';
import { ExamsPage } from '@/components/app/pages/Exams';

export const metadata: Metadata = { title: 'Provas' };

export default function Page() {
  return <ExamsPage />;
}
