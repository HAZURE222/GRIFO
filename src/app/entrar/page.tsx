import type { Metadata } from 'next';
import { LoginScreen } from '@/components/LoginScreen';

export const metadata: Metadata = { title: 'Entrar' };

export default function Page() {
  return <LoginScreen />;
}
