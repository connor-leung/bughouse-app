import type { Metadata } from 'next';
import LobbiesShell from '@/components/lobby/LobbiesShell';

export const metadata: Metadata = {
  title: 'Lobbies',
  description: 'Join an open bughouse lobby or create your own and invite friends.',
  robots: { index: false, follow: true },
};

export default function LobbiesLayout({ children }: { children: React.ReactNode }) {
  return <LobbiesShell>{children}</LobbiesShell>;
}
