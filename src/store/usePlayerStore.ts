import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface PlayerState {
  id: string;
  name: string;
  setName: (name: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      id: Crypto.randomUUID(),
      name: '',
      setName: (name: string) => set({ name: name.trim() }),
    }),
    {
      name: 'bughouse-player',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
