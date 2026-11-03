import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Notebook } from '@/components/app/notebook/Notebook';

export const metadata: Metadata = { title: 'Caderno' };

export default function Page() {
  return (
    <Suspense>
      <Notebook />
    </Suspense>
  );
}
