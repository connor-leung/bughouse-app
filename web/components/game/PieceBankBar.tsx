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
            <span className="w-8 h-8 flex items-center justify-center">
              {defaultPieces[(color === 'white' ? 'w' : 'b') + ROLE_LETTER[role]]?.({ svgStyle: { width: '32px', height: '32px' } })}
            </span>
            {count > 1 && <span className="text-xs font-bold">×{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
