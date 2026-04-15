'use client';

import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { BoardRole, GameState, clockIndex } from '@/lib/types';

function getActiveBoardRoles(state: GameState): BoardRole[] {
  const active: BoardRole[] = [];
  try {
    const turn1 = new Chess(state.board1.fen).turn(); // 'w' or 'b'
    active.push(turn1 === 'w' ? 'board1White' : 'board1Black');
  } catch {
    // ignore bad FEN
  }
  try {
    const turn2 = new Chess(state.board2.fen).turn();
    active.push(turn2 === 'w' ? 'board2White' : 'board2Black');
  } catch {
    // ignore bad FEN
  }
  return active;
}

export function useChessClocks(
  gameState: GameState | null,
  gameOver: boolean
): [number, number, number, number] {
  const [clocks, setClocks] = useState<[number, number, number, number]>([
    0, 0, 0, 0,
  ]);
  const clocksRef = useRef<[number, number, number, number]>([0, 0, 0, 0]);

  // Sync from server state
  useEffect(() => {
    if (gameState) {
      clocksRef.current = [...gameState.clocksMs] as [number, number, number, number];
      setClocks([...gameState.clocksMs] as [number, number, number, number]);
    }
  }, [gameState?.clocksMs]);

  // Local 100ms tick
  useEffect(() => {
    if (gameOver || !gameState) return;

    const interval = setInterval(() => {
      const activeRoles = getActiveBoardRoles(gameState);
      const next = [...clocksRef.current] as [number, number, number, number];
      for (const role of activeRoles) {
        const idx = clockIndex(role);
        next[idx] = Math.max(0, next[idx] - 100);
      }
      clocksRef.current = next;
      setClocks([...next] as [number, number, number, number]);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, gameOver]);

  return clocks;
}
