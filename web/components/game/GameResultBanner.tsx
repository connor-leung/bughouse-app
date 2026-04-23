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
      won ? 'bg-yellow-950/60 border-yellow-800/40' : 'bg-gray-900 border-gray-800'
    }`}>
      {/* Result */}
      <div className="flex items-center gap-3">
        <span className={`font-bold text-base ${won ? 'text-yellow-400' : 'text-gray-400'}`}>
          {won ? 'Victory' : 'Defeat'}
        </span>
        <span className="text-gray-500 text-xs">
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
              className={`w-2 h-2 rounded-full ${rematchVotes.includes(p.userId) ? 'bg-green-400' : 'bg-gray-700'}`}
            />
          ))}
        </div>
        <span className="text-gray-600 text-xs">{rematchVotes.length}/4</span>

        <button
          onClick={onRematch}
          disabled={myVoted}
          className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-default rounded-lg px-3 py-1 font-semibold transition-colors"
        >
          {myVoted ? 'Waiting…' : 'Rematch'}
        </button>
        <button
          onClick={() => router.push('/home')}
          className="bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1 text-gray-300 transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
