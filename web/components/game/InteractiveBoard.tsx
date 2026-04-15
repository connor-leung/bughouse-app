'use client';

import { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import type { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { BoardSnapshot } from '@/lib/types';

interface Props {
  snapshot: BoardSnapshot;
  orientation: 'white' | 'black';
  myColor: 'white' | 'black';
  isMyTurn: boolean;
  selectedDropPiece: string | null;
  onMove: (from: string, to: string, promotion?: string) => void;
  onDrop: (pieceRole: string, to: string) => void;
  onClearDrop: () => void;
  boardWidth?: number;
}

export default function InteractiveBoard({
  snapshot,
  orientation,
  myColor,
  isMyTurn,
  selectedDropPiece,
  onMove,
  onDrop,
  onClearDrop,
  boardWidth = 420,
}: Props) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [pendingPromo, setPendingPromo] = useState<{ from: string; to: string } | null>(null);

  const chess = useMemo(() => {
    try { return new Chess(snapshot.fen); } catch { return null; }
  }, [snapshot.fen]);

  const isMyColorTurn = chess?.turn() === (myColor === 'white' ? 'w' : 'b');
  const canInteract = isMyTurn && isMyColorTurn;

  function getLegalTargets(square: string): string[] {
    if (!chess) return [];
    return chess.moves({ square: square as Square, verbose: true }).map((m) => m.to);
  }

  function isPawnPromotion(from: string, to: string): boolean {
    if (!chess) return false;
    const piece = chess.get(from as Square);
    if (!piece || piece.type !== 'p') return false;
    const toRank = to[1];
    return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
  }

  function handleSquareClick({ square }: SquareHandlerArgs) {
    // Drop mode
    if (selectedDropPiece && canInteract) {
      const occupied = chess?.get(square as Square);
      if (!occupied) {
        onDrop(selectedDropPiece, square);
        onClearDrop();
        return;
      }
      onClearDrop();
      return;
    }

    if (!canInteract) return;

    // If a square is already selected
    if (selectedSquare) {
      if (legalTargets.includes(square)) {
        if (isPawnPromotion(selectedSquare, square)) {
          setPendingPromo({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalTargets([]);
          return;
        }
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }
      // Re-select own piece
      const targets = getLegalTargets(square);
      if (targets.length > 0) {
        setSelectedSquare(square);
        setLegalTargets(targets);
      } else {
        setSelectedSquare(null);
        setLegalTargets([]);
      }
      return;
    }

    // First click: select piece
    const targets = getLegalTargets(square);
    if (targets.length > 0) {
      setSelectedSquare(square);
      setLegalTargets(targets);
    }
  }

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
      if (!targetSquare) return false;
      if (!canInteract) return false;
      if (isPawnPromotion(sourceSquare, targetSquare)) {
        setPendingPromo({ from: sourceSquare, to: targetSquare });
        setSelectedSquare(null);
        setLegalTargets([]);
        return true;
      }
      onMove(sourceSquare, targetSquare);
      setSelectedSquare(null);
      setLegalTargets([]);
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canInteract, snapshot.fen]
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (snapshot.lastFrom) styles[snapshot.lastFrom] = { backgroundColor: 'rgba(255, 214, 10, 0.3)' };
    if (snapshot.lastTo) styles[snapshot.lastTo] = { backgroundColor: 'rgba(255, 214, 10, 0.3)' };
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: 'rgba(20, 180, 80, 0.5)' };
    for (const sq of legalTargets) {
      styles[sq] = { backgroundColor: 'rgba(20, 180, 80, 0.3)', borderRadius: '50%' };
    }
    return styles;
  }, [snapshot.lastFrom, snapshot.lastTo, selectedSquare, legalTargets]);

  const PROMO_PIECES = ['queen', 'rook', 'bishop', 'knight'];
  const PROMO_PIECE_MAP: Record<string, string> = {
    queen: 'q', rook: 'r', bishop: 'b', knight: 'n',
  };
  const PROMO_UNICODE: Record<string, string> = {
    queen: '♛', rook: '♜', bishop: '♝', knight: '♞',
  };

  return (
    <div className="relative" style={{ width: boardWidth }}>
      <Chessboard
        options={{
          position: snapshot.fen,
          boardOrientation: orientation,
          allowDragging: canInteract,
          onSquareClick: handleSquareClick,
          onPieceDrop: handlePieceDrop,
          squareStyles,
          boardStyle: { borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' },
          darkSquareStyle: { backgroundColor: '#4a4a4a' },
          lightSquareStyle: { backgroundColor: '#9e9e9e' },
        }}
      />
      {snapshot.isCheck && (
        <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
          CHECK
        </div>
      )}

      {/* Promotion picker */}
      {pendingPromo && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-10">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-3 text-center">Promote to:</p>
            <div className="flex gap-3">
              {PROMO_PIECES.map((piece) => (
                <button
                  key={piece}
                  onClick={() => {
                    onMove(pendingPromo.from, pendingPromo.to, PROMO_PIECE_MAP[piece]);
                    setPendingPromo(null);
                  }}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 text-2xl transition-colors"
                  title={piece}
                >
                  {PROMO_UNICODE[piece]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
