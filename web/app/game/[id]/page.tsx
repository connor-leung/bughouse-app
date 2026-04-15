'use client';

import { use } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasDisplayName } from '@/lib/identity';
import GameLayout from '@/components/game/GameLayout';

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (!hasDisplayName()) router.replace('/name-entry');
  }, [router]);

  return <GameLayout gameId={id} />;
}
