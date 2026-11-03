import type { Metadata } from 'next';
import { HistoryPage } from '@/components/app/pages/History';

export const metadata: Metadata = { title: 'Histórico' };

export default function Page() {
  return <HistoryPage />;
}
