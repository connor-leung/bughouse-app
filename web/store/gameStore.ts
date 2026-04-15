import { create } from 'zustand';
import { BoardRole, ChatMessage, GameResult, GameState } from '@/lib/types';

interface GameStore {
  gameState: GameState | null;
  gameResult: GameResult | null;
  myRole: BoardRole | null;
  chatMessages: ChatMessage[];
  error: string | null;
  isConnected: boolean;

  setGameState: (s: GameState) => void;
  setGameResult: (r: GameResult) => void;
  setMyRole: (r: BoardRole) => void;
  appendChat: (m: ChatMessage) => void;
  setError: (e: string | null) => void;
  setConnected: (v: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  gameResult: null,
  myRole: null,
  chatMessages: [],
  error: null,
  isConnected: false,

  setGameState: (gameState) => set({ gameState }),
  setGameResult: (gameResult) => set({ gameResult }),
  setMyRole: (myRole) => set({ myRole }),
  appendChat: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  resetGame: () =>
    set({
      gameState: null,
      gameResult: null,
      myRole: null,
      chatMessages: [],
      error: null,
      isConnected: false,
    }),
}));
