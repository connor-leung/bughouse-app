import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Manages chess clock intervals for the active game.
 * Ticks the currently active player's clock every 100ms.
 */
export function useClock(
  activePlayerId: string | null,
  onExpire: (playerId: string) => void,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const updateClock = useGameStore((s) => s.updateClock);
  const clocksMs = useGameStore((s) => s.clocksMs);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTick();

    if (!activePlayerId) return;

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      const current = useGameStore.getState().clocksMs[activePlayerId] ?? 0;
      const updated = Math.max(0, current - elapsed);
      updateClock(activePlayerId, updated);

      if (updated <= 0) {
        clearTick();
        onExpire(activePlayerId);
      }
    }, 100);

    return clearTick;
  }, [activePlayerId, clearTick, onExpire, updateClock]);

  return clocksMs;
}
