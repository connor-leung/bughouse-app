export type BoardRole =
  | 'board1White'
  | 'board1Black'
  | 'board2White'
  | 'board2Black';

export type LobbyStatus = 'waiting' | 'starting' | 'inProgress' | 'finished';
export type EndReason = 'checkmate' | 'timeout' | 'resignation';

export interface TimeControl {
  minutes: number;
  incrementSeconds: number;
}

export interface PlayerSlot {
  userId: string;
  displayName: string;
  role: BoardRole;
}

export interface Lobby {
  id: string;
  name: string;
  hostUserId: string;
  slots: (PlayerSlot | null)[]; // always length 4
  timeControl: TimeControl;
  status: LobbyStatus;
  readyPlayerIds: string[];
}

export interface BoardSnapshot {
  fen: string;
  isCheck: boolean;
  lastFrom?: string;
  lastTo?: string;
}

export interface PieceBank {
  pawn?: number;
  knight?: number;
  bishop?: number;
  rook?: number;
  queen?: number;
}

export interface GameBanks {
  board1White: PieceBank;
  board1Black: PieceBank;
  board2White: PieceBank;
  board2Black: PieceBank;
}

export interface GameState {
  gameId: string;
  board1: BoardSnapshot;
  board2: BoardSnapshot;
  bank: GameBanks;
  /** [board1White=0, board1Black=1, board2White=2, board2Black=3] */
  clocksMs: [number, number, number, number];
  players: PlayerSlot[];
}

export interface GameResult {
  winningTeam: 1 | 2;
  reason: EndReason;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
}

export interface WsEnvelope<T = unknown> {
  type: string;
  data: T;
}

// --- Helpers ---

/** Team 1: board1White + board2Black | Team 2: board1Black + board2White */
export function roleTeam(role: BoardRole): 1 | 2 {
  return role === 'board1White' || role === 'board2Black' ? 1 : 2;
}

export function clockIndex(role: BoardRole): 0 | 1 | 2 | 3 {
  const map: Record<BoardRole, 0 | 1 | 2 | 3> = {
    board1White: 0,
    board1Black: 1,
    board2White: 2,
    board2Black: 3,
  };
  return map[role];
}

export function opponentRole(role: BoardRole): BoardRole {
  const map: Record<BoardRole, BoardRole> = {
    board1White: 'board1Black',
    board1Black: 'board1White',
    board2White: 'board2Black',
    board2Black: 'board2White',
  };
  return map[role];
}

export function partnerRole(role: BoardRole): BoardRole {
  const map: Record<BoardRole, BoardRole> = {
    board1White: 'board2Black',
    board1Black: 'board2White',
    board2White: 'board1Black',
    board2Black: 'board1White',
  };
  return map[role];
}

export function roleBoard(role: BoardRole): 1 | 2 {
  return role === 'board1White' || role === 'board1Black' ? 1 : 2;
}

export function roleColor(role: BoardRole): 'white' | 'black' {
  return role === 'board1White' || role === 'board2White' ? 'white' : 'black';
}

export const PIECE_ROLES: (keyof PieceBank)[] = [
  'queen',
  'rook',
  'bishop',
  'knight',
  'pawn',
];
