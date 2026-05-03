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
  isReady: boolean;
  onJoin: () => void;
  hideRole?: boolean;
}

export default function PlayerSlotTile({ role, slot, isMe, isReady, onJoin, hideRole }: Props) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? 'border-accent/40 bg-accent/8' : 'border-white/7 bg-surface'}`}>
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${slot ? (isReady ? 'bg-success' : 'bg-muted') : 'bg-elevated'}`} />
        <div className="min-w-0">
          {!hideRole && <p className="text-xs text-muted font-medium">{ROLE_LABELS[role]}</p>}
          {slot ? (
            <p className={`font-semibold mt-0.5 truncate ${isMe ? 'text-accent-bright' : 'text-primary'}`}>
              {slot.displayName} {isMe && <span className="text-xs text-accent-bright">(you)</span>}
            </p>
          ) : (
            <p className="text-muted mt-0.5">Empty</p>
          )}
        </div>
      </div>
      {!slot && (
        <button
          onClick={onJoin}
          className="flex-shrink-0 bg-elevated hover:bg-hover border border-white/7 hover:border-white/12 rounded-lg px-3 py-1 text-xs font-medium transition-colors text-secondary"
        >
          Join
        </button>
      )}
      {slot && isReady && (
        <span className="flex-shrink-0 text-xs text-success font-semibold">Ready</span>
      )}
    </div>
  );
}
