import { Chess } from 'chess.js';
import type { PieceSymbol, Color, Square, Reserve } from '../types/game';

export interface DropValidationResult {
  valid: boolean;
  reason?: string;
}

export interface DropValidationInput {
  piece: PieceSymbol;
  to: Square;
  color: Color;
  reserve: Reserve;
  chess: Chess;
}

/**
 * Validates all bughouse-specific rules for a drop move.
 */
export function validateDrop(input: DropValidationInput): DropValidationResult {
  const { piece, to, color, reserve, chess } = input;

  // Kings can never be dropped
  if (piece === 'k') {
    return { valid: false, reason: 'Kings cannot be dropped.' };
  }

  // Player must have the piece in reserve
  const count = reserve[piece] ?? 0;
  if (count <= 0) {
    return { valid: false, reason: `No ${piece.toUpperCase()} in reserve.` };
  }

  // Target square must be empty
  const occupant = chess.get(to as any);
  if (occupant) {
    return { valid: false, reason: 'Target square is occupied.' };
  }

  // Pawns cannot be dropped on rank 1 or rank 8
  if (piece === 'p') {
    const rank = to[1];
    if (rank === '1' || rank === '8') {
      return { valid: false, reason: 'Pawns cannot be dropped on the first or last rank.' };
    }
  }

  // The drop must not leave the dropping player's king in check.
  // We test this by temporarily placing the piece and checking the resulting position.
  const testChess = new Chess(chess.fen());
  testChess.put({ type: piece, color }, to as any);

  // After placing, check if the dropping player's king is in check.
  // chess.js considers the turn from the FEN; we need to check from the dropper's perspective.
  // We load a modified FEN with the dropper's color as the active side to use inCheck().
  const fenParts = testChess.fen().split(' ');
  fenParts[1] = color;
  try {
    const checkTestChess = new Chess(fenParts.join(' '));
    if (checkTestChess.inCheck()) {
      return { valid: false, reason: 'Drop would leave your king in check.' };
    }
  } catch {
    // If the FEN is invalid for some reason, allow the drop (edge case)
  }

  return { valid: true };
}
