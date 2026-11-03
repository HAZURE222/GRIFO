import type { Metadata } from 'next';
import { ReviewsPage } from '@/components/app/pages/Reviews';

export const metadata: Metadata = { title: 'Revisões' };

export default function Page() {
  return <ReviewsPage />;
}
