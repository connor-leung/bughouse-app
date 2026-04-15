import { create } from 'zustand';
import { BoardRole, Lobby, TimeControl } from '@/lib/types';

interface LobbyActions {
  createLobby: (name: string, timeControl: TimeControl) => void;
  joinLobby: (lobbyId: string, slotIndex: number) => void;
  leaveLobby: (lobbyId: string) => void;
  startGame: (lobbyId: string) => void;
}

interface LobbyStore {
  lobbies: Lobby[];
  currentLobby: Lobby | null;
  pendingGame: { gameId: string; role: BoardRole } | null;
  error: string | null;
  isConnected: boolean;
  actions: LobbyActions | null;

  setLobbies: (lobbies: Lobby[]) => void;
  upsertLobby: (lobby: Lobby) => void;
  setCurrentLobby: (lobby: Lobby | null) => void;
  setPendingGame: (g: { gameId: string; role: BoardRole } | null) => void;
  setError: (e: string | null) => void;
  setConnected: (v: boolean) => void;
  setActions: (a: LobbyActions | null) => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobbies: [],
  currentLobby: null,
  pendingGame: null,
  error: null,
  isConnected: false,
  actions: null,

  setLobbies: (lobbies) => set({ lobbies }),
  upsertLobby: (lobby) =>
    set((s) => {
      const existing = s.lobbies.find((l) => l.id === lobby.id);
      const lobbies = existing
        ? s.lobbies.map((l) => (l.id === lobby.id ? lobby : l))
        : [...s.lobbies, lobby];
      const currentLobby =
        s.currentLobby?.id === lobby.id ? lobby : s.currentLobby;
      return { lobbies, currentLobby };
    }),
  setCurrentLobby: (currentLobby) => set({ currentLobby }),
  setPendingGame: (pendingGame) => set({ pendingGame }),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  setActions: (actions) => set({ actions }),
}));
