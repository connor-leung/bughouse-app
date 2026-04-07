export type Color = 'w' | 'b';
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square = string; // 'a1' through 'h8'
export type BoardSide = 'A' | 'B';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

// Reserve: pieces a player can drop (captured from opponent's board)
export type Reserve = Partial<Record<PieceSymbol, number>>;

export interface BoardState {
  fen: string;
  turn: Color;
  reserveWhite: Reserve;
  reserveBlack: Reserve;
  isGameOver: boolean;
  termination: 'checkmate' | 'timeout' | 'resignation' | null;
  winner: Color | null;
}

export interface PlayerSlot {
  playerId: string;
  playerName: string;
}

export interface ClockState {
  [playerId: string]: number; // ms remaining
  lastSyncAt: number;
}

export type MoveType = 'regular' | 'drop';

export interface RegularMove {
  type: 'regular';
  boardSide: BoardSide;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  playerId: string;
  timestamp: number;
  seq: number;
}

export interface DropMove {
  type: 'drop';
  boardSide: BoardSide;
  piece: PieceSymbol;
  to: Square;
  playerId: string;
  timestamp: number;
  seq: number;
}

export type GameMove = RegularMove | DropMove;

export interface GamePlayers {
  boardA: { white: PlayerSlot; black: PlayerSlot };
  boardB: { white: PlayerSlot; black: PlayerSlot };
}

export interface GameState {
  gameId: string;
  lobbyId: string;
  boardA: BoardState;
  boardB: BoardState;
  players: GamePlayers;
  clocks: ClockState;
  status: 'waiting' | 'active' | 'finished';
  startedAt: number | null;
  finishedAt: number | null;
  moveHistory: GameMove[];
  winnerTeam: 'A' | 'B' | null; // team A = boardA white + boardB black, team B = boardA black + boardB white
}

export type TerminationReason = 'checkmate' | 'timeout' | 'resignation';

export interface TerminationResult {
  board: BoardSide;
  reason: TerminationReason;
  losingColor: Color;
}
