'use client';

import { use } from 'react';
import LobbyRoom from '@/components/lobby/LobbyRoom';

export default function LobbyRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LobbyRoom lobbyId={id} />;
}
