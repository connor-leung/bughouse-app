'use client';

import { use } from 'react';
import LobbyRoom from '@/components/lobby/LobbyRoom';

export default function LobbyRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Ghost board backgrounds */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-8 px-8">
        <div className="w-[420px] h-[420px] rounded-xl bg-gray-800/30 border border-gray-700/20" />
        <div className="w-[280px] h-[280px] rounded-xl bg-gray-800/20 border border-gray-700/15" />
      </div>
      {/* Modal overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <LobbyRoom lobbyId={id} />
      </div>
    </div>
  );
}
