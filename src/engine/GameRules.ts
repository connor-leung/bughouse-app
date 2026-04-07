import type { GameState, TerminationResult, BoardSide, Color } from '../types/game';

export function checkTermination(
  state: GameState,
  clocksExpired: Set<string>,
): TerminationResult | null {
  // Check each board for checkmate
  for (const side of ['A', 'B'] as BoardSide[]) {
    const board = side === 'A' ? state.boardA : state.boardB;
    if (board.isGameOver && board.termination === 'checkmate') {
      return {
        board: side,
        reason: 'checkmate',
        losingColor: board.turn,
      };
    }
  }

  // Check for clock expiry
  const { players } = state;
  const allPlayerSlots = [
    { playerId: players.boardA.white.playerId, side: 'A' as BoardSide, color: 'w' as Color },
    { playerId: players.boardA.black.playerId, side: 'A' as BoardSide, color: 'b' as Color },
    { playerId: players.boardB.white.playerId, side: 'B' as BoardSide, color: 'w' as Color },
    { playerId: players.boardB.black.playerId, side: 'B' as BoardSide, color: 'b' as Color },
  ];

  for (const slot of allPlayerSlots) {
    if (clocksExpired.has(slot.playerId)) {
      return {
        board: slot.side,
        reason: 'timeout',
        losingColor: slot.color,
      };
    }
  }

  return null;
}

/**
 * Returns the winning team ('A' or 'B') from a termination result.
 * Team A = boardA white + boardB black
 * Team B = boardA black + boardB white
 */
export function getWinningTeam(termination: TerminationResult): 'A' | 'B' {
  const losingTeam = getTeamForColor(termination.board, termination.losingColor);
  return losingTeam === 'A' ? 'B' : 'A';
}

function getTeamForColor(board: BoardSide, color: Color): 'A' | 'B' {
  if (board === 'A' && color === 'w') return 'A';
  if (board === 'A' && color === 'b') return 'B';
  if (board === 'B' && color === 'w') return 'B';
  return 'A';
}
