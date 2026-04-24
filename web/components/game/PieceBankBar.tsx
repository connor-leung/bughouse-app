'use client';

import { defaultPieces } from 'react-chessboard';
import { PieceBank, PIECE_ROLES } from '@/lib/types';

const ROLE_LETTER: Record<string, string> = {
  queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P',
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
    if (disabled) return null;
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-gray-600 text-sm">
        No pieces in reserve
      </div>
    );
  }

  const tileBg = color === 'white' ? 'bg-gray-700' : 'bg-gray-300';

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
            className={`relative flex items-center justify-center rounded-lg transition-colors
              ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900' : ''}
              ${disabled ? 'opacity-60 cursor-default' : 'hover:scale-110'}`}
          >
            <span className={`w-10 h-10 flex items-center justify-center rounded-lg ${isSelected ? 'bg-yellow-600' : tileBg}`}>
              {defaultPieces[(color === 'white' ? 'w' : 'b') + ROLE_LETTER[role]]?.({ svgStyle: { width: '36px', height: '36px' } })}
            </span>
            {count > 1 && (
              <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
