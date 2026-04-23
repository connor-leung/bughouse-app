'use client';

import { PlayerSlot, roleTeam } from '@/lib/types';

interface Props {
  players: PlayerSlot[];
  scores: [number, number];
  myUserId: string;
}

export default function Scoreboard({ players, scores, myUserId }: Props) {
  const team1 = players.filter((p) => roleTeam(p.role) === 1);
  const team2 = players.filter((p) => roleTeam(p.role) === 2);
  const hasGames = scores[0] + scores[1] > 0;

  if (!hasGames) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-3 w-full">
      <div className="flex items-center justify-between">
        {/* Team 1 */}
        <div className="flex-1 min-w-0">
          {team1.map((p) => (
            <p
              key={p.userId}
              className={`text-xs truncate ${p.userId === myUserId ? 'text-blue-300 font-semibold' : 'text-gray-300'}`}
            >
              {p.displayName}
            </p>
          ))}
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-3 font-mono text-lg font-bold">
          <span className={scores[0] >= scores[1] ? 'text-white' : 'text-gray-500'}>{scores[0]}</span>
          <span className="text-gray-600 text-sm">-</span>
          <span className={scores[1] >= scores[0] ? 'text-white' : 'text-gray-500'}>{scores[1]}</span>
        </div>

        {/* Team 2 */}
        <div className="flex-1 min-w-0 text-right">
          {team2.map((p) => (
            <p
              key={p.userId}
              className={`text-xs truncate ${p.userId === myUserId ? 'text-blue-300 font-semibold' : 'text-gray-300'}`}
            >
              {p.displayName}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
