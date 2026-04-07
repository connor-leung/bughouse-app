import { Chess } from 'chess.js';
import { validateDrop } from './DropValidator';
import { flipTurnInFen } from '../lib/fenUtils';
import type {
  BoardSide,
  BoardState,
  Color,
  GameMove,
  PieceSymbol,
  RegularMove,
  DropMove,
  Reserve,
} from '../types/game';

export interface ApplyResult {
  success: boolean;
  error?: string;
  capturedPiece?: PieceSymbol;
  newBoardState?: BoardState;
}

// Pieces that, when captured as promoted versions, revert to pawns in reserve
const PROMOTABLE: PieceSymbol[] = ['q', 'r', 'b', 'n'];

function emptyReserve(): Reserve {
  return {};
}

function emptyBoardState(fen: string): BoardState {
  return {
    fen,
    turn: 'w',
    reserveWhite: emptyReserve(),
    reserveBlack: emptyReserve(),
    isGameOver: false,
    termination: null,
    winner: null,
  };
}

/**
 * Core bughouse engine. Owns two chess.js instances (one per board) and all
 * reserve state. All move application goes through this class.
 */
export class BughouseEngine {
  private boards: { A: Chess; B: Chess };
  // reserves[boardSide][color] = pieces available to drop on that board for that color
  private reserves: { A: { w: Reserve; b: Reserve }; B: { w: Reserve; b: Reserve } };
  // Track which pieces on each board were placed via drops (to handle promoted-pawn reversion)
  // We track promotions by storing the last move from chess.js to detect them
  private promotedSquares: { A: Set<string>; B: Set<string> };

  constructor() {
    this.boards = {
      A: new Chess(),
      B: new Chess(),
    };
    this.reserves = {
      A: { w: emptyReserve(), b: emptyReserve() },
      B: { w: emptyReserve(), b: emptyReserve() },
    };
    this.promotedSquares = { A: new Set(), B: new Set() };
  }

  /**
   * Load state from serialized board states (e.g., after reconnect).
   */
  loadFromBoardStates(boardA: BoardState, boardB: BoardState): void {
    this.boards.A = new Chess(boardA.fen);
    this.boards.B = new Chess(boardB.fen);
    this.reserves.A = { w: { ...boardA.reserveWhite }, b: { ...boardA.reserveBlack } };
    this.reserves.B = { w: { ...boardB.reserveWhite }, b: { ...boardB.reserveBlack } };
    this.promotedSquares = { A: new Set(), B: new Set() };
  }

  /**
   * Replay an array of moves from the beginning to reconstruct state.
   */
  replayMoves(moves: GameMove[]): void {
    this.boards = { A: new Chess(), B: new Chess() };
    this.reserves = {
      A: { w: emptyReserve(), b: emptyReserve() },
      B: { w: emptyReserve(), b: emptyReserve() },
    };
    this.promotedSquares = { A: new Set(), B: new Set() };

    for (const move of moves) {
      if (move.type === 'regular') {
        this.applyRegularMove(move);
      } else {
        this.applyDropMove(move);
      }
    }
  }

  /**
   * Apply a regular chess move on the specified board.
   * If a capture occurs, the piece is added to the partner board's reserve.
   */
  applyRegularMove(move: RegularMove): ApplyResult {
    const chess = this.boards[move.boardSide];

    const result = chess.move({
      from: move.from as any,
      to: move.to as any,
      promotion: move.promotion,
    });

    if (!result) {
      return { success: false, error: 'Illegal move' };
    }

    // Track promotions: if a pawn promoted, mark the destination square
    if (result.flags.includes('p')) {
      this.promotedSquares[move.boardSide].add(move.to);
    } else {
      // If a piece moved away, remove the promoted tracking for that square
      this.promotedSquares[move.boardSide].delete(move.from);
    }

    let capturedPiece: PieceSymbol | undefined;

    if (result.captured) {
      capturedPiece = result.captured as PieceSymbol;

      // Bughouse rule: promoted pieces revert to pawns when captured
      const capturedSquare = move.to;
      const partnerBoard: BoardSide = move.boardSide === 'A' ? 'B' : 'A';
      const beneficiaryColor = result.color as Color; // the mover gets pieces for their partner

      let pieceToAdd: PieceSymbol = capturedPiece;
      if (
        PROMOTABLE.includes(capturedPiece) &&
        this.promotedSquares[move.boardSide].has(capturedSquare)
      ) {
        pieceToAdd = 'p'; // promoted piece reverts to pawn
        this.promotedSquares[move.boardSide].delete(capturedSquare);
      }

      // Add to partner board reserve for the capturing player's color
      const currentCount = this.reserves[partnerBoard][beneficiaryColor][pieceToAdd] ?? 0;
      this.reserves[partnerBoard][beneficiaryColor][pieceToAdd] = currentCount + 1;
    }

    const boardState = this.getBoardState(move.boardSide);
    return { success: true, capturedPiece, newBoardState: boardState };
  }

  /**
   * Apply a drop move: place a piece from reserve onto a vacant square.
   */
  applyDropMove(move: DropMove): ApplyResult {
    const chess = this.boards[move.boardSide];
    const currentColor = chess.turn() as Color;
    const reserve = this.reserves[move.boardSide][currentColor];

    const validation = validateDrop({
      piece: move.piece,
      to: move.to,
      color: currentColor,
      reserve,
      chess,
    });

    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // Decrement reserve
    reserve[move.piece] = (reserve[move.piece] ?? 0) - 1;
    if (reserve[move.piece] === 0) {
      delete reserve[move.piece];
    }

    // Place the piece
    chess.put({ type: move.piece, color: currentColor }, move.to as any);

    // chess.js does not advance turn after put(), so we manually flip turn via FEN
    const newFen = flipTurnInFen(chess.fen());
    chess.load(newFen, { skipValidation: true });

    const boardState = this.getBoardState(move.boardSide);
    return { success: true, newBoardState: boardState };
  }

  /**
   * Returns the current serializable board state for the given side.
   */
  getBoardState(side: BoardSide): BoardState {
    const chess = this.boards[side];
    const reserves = this.reserves[side];

    let isGameOver = false;
    let termination: BoardState['termination'] = null;
    let winner: Color | null = null;

    if (chess.isCheckmate()) {
      isGameOver = true;
      termination = 'checkmate';
      // The player who just moved wins
      winner = (chess.turn() === 'w' ? 'b' : 'w') as Color;
    } else if (chess.isDraw() || chess.isStalemate()) {
      isGameOver = true;
      termination = null;
      winner = null;
    }

    return {
      fen: chess.fen(),
      turn: chess.turn() as Color,
      reserveWhite: { ...reserves.w },
      reserveBlack: { ...reserves.b },
      isGameOver,
      termination,
      winner,
    };
  }

  getBothBoardStates(): { A: BoardState; B: BoardState } {
    return {
      A: this.getBoardState('A'),
      B: this.getBoardState('B'),
    };
  }

  /**
   * Get legal moves for a piece at the given square (for highlighting).
   */
  getLegalMovesFrom(side: BoardSide, square: string): string[] {
    const chess = this.boards[side];
    return chess.moves({ square: square as any, verbose: true }).map((m: any) => m.to);
  }

  /**
   * Get valid drop squares for a piece type and color on a given board.
   */
  getValidDropSquares(side: BoardSide, piece: PieceSymbol, color: Color): string[] {
    const chess = this.boards[side];
    const squares: string[] = [];

    for (let file = 0; file < 8; file++) {
      for (let rank = 1; rank <= 8; rank++) {
        const sq = String.fromCharCode(97 + file) + rank;
        const result = validateDrop({
          piece,
          to: sq,
          color,
          reserve: this.reserves[side][color],
          chess,
        });
        if (result.valid) squares.push(sq);
      }
    }

    return squares;
  }

  getReserve(side: BoardSide, color: Color): Reserve {
    return { ...this.reserves[side][color] };
  }

  isInCheck(side: BoardSide): boolean {
    return this.boards[side].inCheck();
  }
}

export function createInitialBoardState(): BoardState {
  const chess = new Chess();
  return emptyBoardState(chess.fen());
}
