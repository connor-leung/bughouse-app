'use client';

import { Lobby } from '@/lib/types';

interface Props {
  lobby: Lobby;
  onJoin: (slotIndex: number) => void;
}

export default function LobbyCard({ lobby, onJoin }: Props) {
  const filled = lobby.slots.filter(Boolean).length;
  const firstEmpty = lobby.slots.findIndex((s) => s === null);
  const { minutes, incrementSeconds } = lobby.timeControl;
  const tcLabel = incrementSeconds > 0 ? `${minutes}+${incrementSeconds}` : `${minutes}+0`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-100">{lobby.name}</p>
        <p className="text-sm text-gray-400 mt-0.5">
          {tcLabel} min &middot; {filled}/4 players
        </p>
      </div>
      <button
        onClick={() => onJoin(firstEmpty)}
        disabled={firstEmpty === -1}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
      >
        Join
      </button>
    </div>
  );
}
