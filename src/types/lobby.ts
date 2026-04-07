export interface Player {
  id: string; // UUID v4, generated client-side on first launch
  name: string;
}

export type LobbyStatus = 'waiting' | 'starting' | 'in_game';

export type SeatId = 'A_white' | 'A_black' | 'B_white' | 'B_black';

export interface LobbyPlayer {
  id: string;
  lobbyId: string;
  playerId: string;
  playerName: string;
  seat: SeatId;
  joinedAt: string;
}

export interface Lobby {
  id: string;
  name: string;
  hostId: string;
  status: LobbyStatus;
  timeControlSeconds: number;
  createdAt: string;
  players: LobbyPlayer[];
  gameId: string | null;
}

export interface CreateLobbyParams {
  name: string;
  timeControlSeconds: number;
  hostId: string;
  hostName: string;
}
