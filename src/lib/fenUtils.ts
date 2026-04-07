/**
 * FEN manipulation helpers for bughouse-specific operations.
 * chess.js doesn't advance the turn after put(), so we must do it manually.
 */

/**
 * Given a FEN string, flip the active color (w→b or b→w),
 * reset en passant (drops can't create en passant state for the dropper),
 * and increment move counters appropriately.
 */
export function flipTurnInFen(fen: string): string {
  const parts = fen.split(' ');
  if (parts.length < 6) throw new Error(`Invalid FEN: ${fen}`);

  const [position, activeColor, castling, _enPassant, halfmove, fullmove] = parts;

  const newActiveColor = activeColor === 'w' ? 'b' : 'w';
  // After a drop there is no en passant target, and the half-move clock resets
  // only for pawn moves/captures. Drops are not captures, so increment halfmove.
  const newHalfmove = String(parseInt(halfmove, 10) + 1);
  // Full move increments after black's move
  const newFullmove = newActiveColor === 'w'
    ? String(parseInt(fullmove, 10) + 1)
    : fullmove;

  return [position, newActiveColor, castling, '-', newHalfmove, newFullmove].join(' ');
}

/**
 * Extract the active color from a FEN string.
 */
export function getActiveColor(fen: string): 'w' | 'b' {
  const parts = fen.split(' ');
  return parts[1] as 'w' | 'b';
}

/**
 * Extract just the board position part from a FEN string.
 */
export function getBoardPosition(fen: string): string {
  return fen.split(' ')[0];
}

/**
 * Validate that a FEN string has the correct number of fields.
 */
export function isValidFenStructure(fen: string): boolean {
  const parts = fen.split(' ');
  return parts.length === 6;
}
