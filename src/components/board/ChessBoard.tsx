import React, { useCallback, useMemo } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import Svg from 'react-native-svg';
import { BoardSquare } from './BoardSquare';
import { ChessPiece } from './ChessPiece';
import { useGameStore } from '../../store/useGameStore';
import type { BoardSide, Color, PieceSymbol } from '../../types/game';

interface ChessBoardProps {
  side: BoardSide;
  size: number;
  perspective: Color; // 'w' = white at bottom, 'b' = black at bottom
  myColor: Color;
  isMyTurn: boolean;
  onMove: (from: string, to: string, promotion?: PieceSymbol) => void;
  onDrop: (piece: PieceSymbol, to: string) => void;
  lastMove: { from: string; to: string } | null;
  inCheckSquare: string | null; // square of king in check
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];

function squareToCoords(
  sq: string,
  squareSize: number,
  flipped: boolean,
): { x: number; y: number } {
  const file = FILES.indexOf(sq[0]);
  const rank = parseInt(sq[1], 10) - 1;

  const col = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;

  return { x: col * squareSize, y: row * squareSize };
}

export function ChessBoard({
  side,
  size,
  perspective,
  myColor,
  isMyTurn,
  onMove,
  onDrop,
  lastMove,
  inCheckSquare,
}: ChessBoardProps) {
  const squareSize = size / 8;
  const flipped = perspective === 'b';

  const game = useGameStore((s) => s.game);
  const selection = useGameStore((s) => s.selection);
  const engine = useGameStore((s) => s.engine);
  const setSelection = useGameStore((s) => s.setSelection);
  const clearSelection = useGameStore((s) => s.clearSelection);

  const boardState = game ? (side === 'A' ? game.boardA : game.boardB) : null;

  // Parse pieces from FEN
  const pieces = useMemo(() => {
    if (!boardState) return [];
    const result: Array<{ sq: string; type: PieceSymbol; color: Color }> = [];
    const rows = boardState.fen.split(' ')[0].split('/');

    for (let rank = 0; rank < 8; rank++) {
      const row = rows[7 - rank]; // FEN rank 8 is first
      let file = 0;
      for (const ch of row) {
        if (ch >= '1' && ch <= '8') {
          file += parseInt(ch, 10);
        } else {
          const color: Color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toLowerCase() as PieceSymbol;
          const sq = FILES[file] + (rank + 1);
          result.push({ sq, type, color });
          file++;
        }
      }
    }
    return result;
  }, [boardState?.fen]);

  const handleSquareTap = useCallback(
    (sq: string) => {
      if (!isMyTurn || !engine || !boardState) return;

      const { boardSide, square, dropPiece, legalSquares } = selection;

      // If a drop is selected
      if (dropPiece && boardSide === side) {
        if (legalSquares.includes(sq)) {
          onDrop(dropPiece as PieceSymbol, sq);
        }
        clearSelection();
        return;
      }

      // If a piece is already selected
      if (square && boardSide === side) {
        if (legalSquares.includes(sq)) {
          // Check for pawn promotion
          const piece = pieces.find((p) => p.sq === square);
          const needsPromotion =
            piece?.type === 'p' &&
            ((myColor === 'w' && sq[1] === '8') || (myColor === 'b' && sq[1] === '1'));
          onMove(square, sq, needsPromotion ? 'q' : undefined);
          clearSelection();
        } else if (sq === square) {
          clearSelection();
        } else {
          // Tap a different own piece
          const tappedPiece = pieces.find((p) => p.sq === sq && p.color === myColor);
          if (tappedPiece) {
            const legalMoves = engine.getLegalMovesFrom(side, sq);
            setSelection({ boardSide: side, square: sq, dropPiece: null, legalSquares: legalMoves });
          } else {
            clearSelection();
          }
        }
        return;
      }

      // No selection — select a piece
      const tappedPiece = pieces.find((p) => p.sq === sq && p.color === myColor);
      if (tappedPiece && boardState.turn === myColor) {
        const legalMoves = engine.getLegalMovesFrom(side, sq);
        setSelection({ boardSide: side, square: sq, dropPiece: null, legalSquares: legalMoves });
      }
    },
    [
      isMyTurn,
      engine,
      boardState,
      selection,
      side,
      pieces,
      myColor,
      onDrop,
      onMove,
      clearSelection,
      setSelection,
    ],
  );

  if (!boardState) return null;

  const isSelected = (sq: string) =>
    selection.boardSide === side && selection.square === sq;

  const isLegalTarget = (sq: string) =>
    selection.boardSide === side && selection.legalSquares.includes(sq);

  const isLastMoveSquare = (sq: string) =>
    lastMove?.from === sq || lastMove?.to === sq;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Squares */}
        {FILES.map((file, fi) =>
          RANKS.map((rank) => {
            const sq = file + rank;
            const isLight = (fi + (rank - 1)) % 2 === 0;
            const { x, y } = squareToCoords(sq, squareSize, flipped);
            return (
              <BoardSquare
                key={sq}
                x={x}
                y={y}
                size={squareSize}
                isLight={isLight}
                isSelected={isSelected(sq)}
                isLegalTarget={isLegalTarget(sq)}
                isLastMove={isLastMoveSquare(sq)}
                isInCheck={inCheckSquare === sq}
              />
            );
          }),
        )}

        {/* Pieces */}
        {pieces.map(({ sq, type, color }) => {
          const { x, y } = squareToCoords(sq, squareSize, flipped);
          return (
            <ChessPiece
              key={sq}
              type={type}
              color={color}
              x={x}
              y={y}
              size={squareSize}
            />
          );
        })}
      </Svg>

      {/* Touch overlay — one touchable per square */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}
      >
        {FILES.map((file, fi) =>
          RANKS.map((rank) => {
            const sq = file + rank;
            const { x, y } = squareToCoords(sq, squareSize, flipped);
            return (
              <TouchableWithoutFeedback
                key={sq}
                onPress={() => handleSquareTap(sq)}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: squareSize,
                    height: squareSize,
                  }}
                />
              </TouchableWithoutFeedback>
            );
          }),
        )}
      </View>
    </View>
  );
}
