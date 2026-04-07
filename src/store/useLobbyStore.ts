import { create } from 'zustand';
import type { Lobby, LobbyPlayer, SeatId } from '../types/lobby';
import { supabase } from '../lib/supabase';

interface LobbyState {
  lobbies: Lobby[];
  currentLobby: Lobby | null;
  isLoading: boolean;
  error: string | null;

  fetchLobbies: () => Promise<void>;
  createLobby: (params: {
    name: string;
    timeControlSeconds: number;
    hostId: string;
    hostName: string;
  }) => Promise<string | null>;
  joinLobby: (lobbyId: string, playerId: string, playerName: string, seat: SeatId) => Promise<boolean>;
  leaveLobby: (lobbyId: string, playerId: string) => Promise<void>;
  setCurrentLobby: (lobby: Lobby | null) => void;
  updateLobby: (lobby: Lobby) => void;
  updateLobbyPlayers: (lobbyId: string, players: LobbyPlayer[]) => void;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
  lobbies: [],
  currentLobby: null,
  isLoading: false,
  error: null,

  fetchLobbies: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: lobbiesData, error: lobbiesError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (lobbiesError) throw lobbiesError;

      const { data: playersData } = await supabase
        .from('lobby_players')
        .select('*')
        .in('lobby_id', (lobbiesData ?? []).map((l: any) => l.id));

      const lobbies: Lobby[] = (lobbiesData ?? []).map((l: any) => ({
        id: l.id,
        name: l.name,
        hostId: l.host_id,
        status: l.status,
        timeControlSeconds: l.time_control_seconds,
        createdAt: l.created_at,
        gameId: l.game_id ?? null,
        players: (playersData ?? [])
          .filter((p: any) => p.lobby_id === l.id)
          .map((p: any) => ({
            id: p.id,
            lobbyId: p.lobby_id,
            playerId: p.player_id,
            playerName: p.player_name,
            seat: p.seat,
            joinedAt: p.joined_at,
          })),
      }));

      set({ lobbies, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  createLobby: async ({ name, timeControlSeconds, hostId, hostName }) => {
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .insert({ name, host_id: hostId, time_control_seconds: timeControlSeconds })
        .select()
        .single();

      if (error || !data) throw error ?? new Error('No data returned');

      // Host takes the first seat (A_white)
      await supabase.from('lobby_players').insert({
        lobby_id: data.id,
        player_id: hostId,
        player_name: hostName,
        seat: 'A_white',
      });

      return data.id as string;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  joinLobby: async (lobbyId, playerId, playerName, seat) => {
    try {
      const { error } = await supabase.from('lobby_players').insert({
        lobby_id: lobbyId,
        player_id: playerId,
        player_name: playerName,
        seat,
      });
      return !error;
    } catch {
      return false;
    }
  },

  leaveLobby: async (lobbyId, playerId) => {
    await supabase
      .from('lobby_players')
      .delete()
      .eq('lobby_id', lobbyId)
      .eq('player_id', playerId);
  },

  setCurrentLobby: (lobby) => set({ currentLobby: lobby }),

  updateLobby: (lobby) => {
    set((state) => ({
      lobbies: state.lobbies.map((l) => (l.id === lobby.id ? lobby : l)),
      currentLobby: state.currentLobby?.id === lobby.id ? lobby : state.currentLobby,
    }));
  },

  updateLobbyPlayers: (lobbyId, players) => {
    set((state) => {
      const update = (l: Lobby) =>
        l.id === lobbyId ? { ...l, players } : l;
      return {
        lobbies: state.lobbies.map(update),
        currentLobby: state.currentLobby?.id === lobbyId
          ? update(state.currentLobby)
          : state.currentLobby,
      };
    });
  },
}));
