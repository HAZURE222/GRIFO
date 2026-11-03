import type { Metadata } from 'next';
import { TodayPage } from '@/components/app/pages/Today';

export const metadata: Metadata = { title: 'Hoje' };

export default function Page() {
  return <TodayPage />;
}
