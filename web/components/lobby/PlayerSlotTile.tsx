'use client';

import { BoardRole, PlayerSlot } from '@/lib/types';

const ROLE_LABELS: Record<BoardRole, string> = {
  board1White: 'Board 1 – White',
  board1Black: 'Board 1 – Black',
  board2White: 'Board 2 – White',
  board2Black: 'Board 2 – Black',
};

interface Props {
  role: BoardRole;
  slot: PlayerSlot | null;
  isMe: boolean;
  onJoin: () => void;
}

export default function PlayerSlotTile({ role, slot, isMe, onJoin }: Props) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'border-blue-600 bg-blue-900/20' : 'border-gray-800 bg-gray-900'}`}>
      <div>
        <p className="text-xs text-gray-500 font-medium">{ROLE_LABELS[role]}</p>
        {slot ? (
          <p className={`font-semibold mt-0.5 ${isMe ? 'text-blue-300' : 'text-gray-200'}`}>
            {slot.displayName} {isMe && <span className="text-xs text-blue-400">(you)</span>}
          </p>
        ) : (
          <p className="text-gray-600 mt-0.5">Empty</p>
        )}
      </div>
      {!slot && (
        <button
          onClick={onJoin}
          className="bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1 text-xs font-semibold transition-colors"
        >
          Join
        </button>
      )}
    </div>
  );
}
