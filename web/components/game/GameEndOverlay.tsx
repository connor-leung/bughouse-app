'use client';

import { useRouter } from 'next/navigation';
import { BoardRole, GameResult, roleTeam } from '@/lib/types';

interface Props {
  result: GameResult;
  myRole: BoardRole | null;
}

const REASON_LABELS: Record<string, string> = {
  checkmate: 'by checkmate',
  timeout: 'on time',
  resignation: 'by resignation',
};

export default function GameEndOverlay({ result, myRole }: Props) {
  const router = useRouter();
  const myTeam = myRole ? roleTeam(myRole) : null;
  const won = myTeam === result.winningTeam;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
        <p className={`text-5xl font-black mb-2 ${won ? 'text-yellow-400' : 'text-gray-400'}`}>
          {won ? 'Victory!' : 'Defeat'}
        </p>
        <p className="text-gray-400 mb-1">
          Team {result.winningTeam} wins {REASON_LABELS[result.reason] ?? ''}
        </p>
        {myTeam && (
          <p className="text-sm text-gray-500 mb-6">You were on Team {myTeam}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/home')}
            className="bg-blue-600 hover:bg-blue-500 rounded-lg px-6 py-2.5 font-semibold transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => router.push('/lobbies')}
            className="bg-gray-700 hover:bg-gray-600 rounded-lg px-6 py-2.5 font-semibold transition-colors"
          >
            Find Game
          </button>
        </div>
      </div>
    </div>
  );
}
