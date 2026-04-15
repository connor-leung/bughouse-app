'use client';

import { PieceBank, PIECE_ROLES } from '@/lib/types';

const PIECE_UNICODE: Record<string, { white: string; black: string }> = {
  queen:  { white: '♛', black: '♛' },
  rook:   { white: '♜', black: '♜' },
  bishop: { white: '♝', black: '♝' },
  knight: { white: '♞', black: '♞' },
  pawn:   { white: '♟', black: '♟' },
};

interface Props {
  bank: PieceBank;
  color: 'white' | 'black';
  selectedPiece: string | null;
  onSelectPiece: (role: string | null) => void;
  disabled?: boolean;
}

export default function PieceBankBar({ bank, color, selectedPiece, onSelectPiece, disabled }: Props) {
  const available = PIECE_ROLES.filter((r) => (bank[r] ?? 0) > 0);

  if (available.length === 0) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-gray-600 text-sm">
        No pieces in reserve
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap px-2">
      {available.map((role) => {
        const count = bank[role] ?? 0;
        const isSelected = selectedPiece === role;
        return (
          <button
            key={role}
            disabled={disabled}
            onClick={() => onSelectPiece(isSelected ? null : role)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-lg transition-colors
              ${isSelected ? 'bg-yellow-600 text-white ring-2 ring-yellow-400' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}
              ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span>{PIECE_UNICODE[role]?.[color] ?? role}</span>
            {count > 1 && <span className="text-xs font-bold">×{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
