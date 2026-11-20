'use client';

import { useRouter } from 'next/navigation';
import { BoardRole, GameResult, PlayerSlot, roleTeam } from '@/lib/types';

const REASON_LABELS: Record<string, string> = {
  checkmate: 'Checkmate',
  timeout: 'Time',
  resignation: 'Resignation',
  stalemate: 'Stalemate',
};

const ROLE_LABELS: Record<BoardRole, string> = {
  board1White: 'B1 W',
  board1Black: 'B1 B',
  board2White: 'B2 W',
  board2Black: 'B2 B',
};

interface Props {
  result: GameResult;
  myRole: BoardRole | null;
  players: PlayerSlot[];
  rematchVotes: string[];
  onRematch: () => void;
}

export default function GameResultBanner({ result, myRole, players, rematchVotes, onRematch }: Props) {
  const router = useRouter();
  const myTeam = myRole ? roleTeam(myRole) : null;
  const won = myTeam === result.winningTeam;
  const myVoted = myRole ? rematchVotes.includes(players.find(p => p.role === myRole)?.userId ?? '') : false;

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b text-sm ${
      won ? 'bg-warn/6 border-warn/20' : 'bg-surface border-white/7'
    }`}>
      {/* Result */}
      <div className="flex items-center gap-3">
        <span className={`font-bold text-base ${won ? 'text-warn' : 'text-secondary'}`}>
          {won ? 'Victory' : 'Defeat'}
        </span>
        <span className="text-muted text-xs">
          {REASON_LABELS[result.reason] ?? result.reason}
        </span>
      </div>

      {/* Rematch votes + actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {players.map((p) => (
            <div
              key={p.userId}
              title={`${p.displayName} (${ROLE_LABELS[p.role]})`}
              className={`w-2 h-2 rounded-full ${rematchVotes.includes(p.userId) ? 'bg-success' : 'bg-hover'}`}
            />
          ))}
        </div>
        <span className="text-muted text-xs font-mono">{rematchVotes.length}/4</span>

        <button
          onClick={onRematch}
          disabled={myVoted}
          className="bg-accent hover:bg-accent-bright disabled:opacity-50 disabled:cursor-default rounded-lg px-3 py-1 font-semibold transition-colors shadow-[0_2px_8px_rgba(45,111,240,0.25)]"
        >
          {myVoted ? 'Waiting…' : 'Rematch'}
        </button>
        <button
          onClick={() => router.push('/home')}
          className="bg-elevated hover:bg-hover border border-white/7 rounded-lg px-3 py-1 text-secondary transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
