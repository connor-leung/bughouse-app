'use client';

import { PlayerSlot, roleTeam } from '@/lib/types';

interface Props {
  players: PlayerSlot[];
  scores: [number, number];
  playerScores: Record<string, number>;
  myUserId: string;
}

export default function Scoreboard({ players, scores, playerScores, myUserId }: Props) {
  const total = scores[0] + scores[1];

  if (total === 0) return null;

  const maxWins = Math.max(...players.map((p) => playerScores[p.userId] ?? 0));

  // Group by team so team 1 rows are visually separated from team 2
  const team1 = players.filter((p) => roleTeam(p.role) === 1);
  const team2 = players.filter((p) => roleTeam(p.role) === 2);
  const rows = [...team1, ...team2];

  return (
    <div className="bg-gray-900 rounded-xl p-3 w-full">
      <div className="flex flex-col gap-1">
        {rows.map((p, i) => {
          const wins = playerScores[p.userId] ?? 0;
          const isMe = p.userId === myUserId;
          const isLeading = wins > 0 && wins === maxWins;
          const showDivider = i === team1.length && team2.length > 0;
          return (
            <div key={p.userId}>
              {showDivider && <div className="border-t border-gray-800 my-1" />}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs truncate flex-1 ${isMe ? 'text-blue-300 font-semibold' : 'text-gray-300'}`}>
                  {p.displayName}
                </span>
                <span className={`font-mono text-xs tabular-nums whitespace-nowrap ${isLeading ? 'text-white font-bold' : 'text-gray-500'}`}>
                  {wins}/{total}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
