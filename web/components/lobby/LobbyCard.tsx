'use client';

import { getUserId } from '@/lib/identity';
import { Lobby } from '@/lib/types';

interface Props {
  lobby: Lobby;
  onJoin: (slotIndex: number) => void;
  onView: () => void;
}

export default function LobbyCard({ lobby, onJoin, onView }: Props) {
  const userId = getUserId();
  const filled = lobby.slots.filter(Boolean).length;
  const firstEmpty = lobby.slots.findIndex((s) => s === null);
  const alreadyIn = lobby.slots.some((s) => s?.userId === userId);
  const { minutes, incrementSeconds } = lobby.timeControl;
  const tcLabel = incrementSeconds > 0 ? `${minutes}+${incrementSeconds}` : `${minutes}+0`;

  return (
    <div className="bg-surface border border-white/7 hover:bg-elevated hover:border-white/12 rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer">
      <div>
        <p className="font-semibold text-primary text-sm">{lobby.name}</p>
        <p className="text-xs text-secondary mt-1 font-mono">
          {tcLabel} &middot; {filled}/4
          {lobby.randomTeams && <span className="ml-1 text-accent-bright">&middot; Random</span>}
        </p>
      </div>
      {alreadyIn ? (
        <button
          onClick={onView}
          className="bg-elevated hover:bg-hover border border-white/7 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors text-secondary"
        >
          View
        </button>
      ) : (
        <button
          onClick={() => onJoin(firstEmpty)}
          disabled={firstEmpty === -1}
          className="bg-accent hover:bg-accent-bright disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          Join
        </button>
      )}
    </div>
  );
}
