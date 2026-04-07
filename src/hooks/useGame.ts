import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  subscribeToGame,
  unsubscribeFromGame,
  broadcastMove,
  broadcastResign,
  broadcastClockSync,
  fetchGameFromDb,
  type MoveEvent,
  type ResignEvent,
  type GameOverEvent,
  type ClockSyncEvent,
} from '../lib/realtimeSync';
import { BughouseEngine } from '../engine/BughouseEngine';
import { checkTermination, getWinningTeam } from '../engine/GameRules';
import type { GameMove, BoardSide, Color } from '../types/game';

const CLOCK_SYNC_INTERVAL_MS = 30_000;

export function useGame(gameId: string, myPlayerId: string) {
  const {
    game,
    engine,
    applyMove,
    applyResignation,
    syncFromServer,
    setGameOver,
    initGame,
    clocksMs,
  } = useGameStore();

  const clockSyncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appliedSeqs = useRef<Set<number>>(new Set());

  const loadFromDb = useCallback(async () => {
    const data = await fetchGameFromDb(gameId);
    if (!data) return;

    const moveHistory: GameMove[] = (data.move_history as GameMove[]) ?? [];
    const dbClocks: Record<string, number> = data.clocks ?? {};
    syncFromServer(data.board_a, data.board_b, moveHistory, dbClocks);

    // Update applied sequence tracking
    appliedSeqs.current = new Set(moveHistory.map((m) => m.seq));
  }, [gameId, syncFromServer]);

  const handleMove = useCallback(
    (payload: MoveEvent) => {
      const { move, boardA, boardB, clocks } = payload;

      // Skip if already applied
      if (appliedSeqs.current.has(move.seq)) return;
      appliedSeqs.current.add(move.seq);

      applyMove(move);

      // Sync clocks from broadcast (take minimum to prevent clock cheating)
      const currentClocks = useGameStore.getState().clocksMs;
      const reconciledClocks: Record<string, number> = { ...currentClocks };
      for (const [id, ms] of Object.entries(clocks)) {
        reconciledClocks[id] = Math.min(reconciledClocks[id] ?? ms, ms);
      }

      const { game: currentGame } = useGameStore.getState();
      if (currentGame) {
        syncFromServer(boardA, boardB, [...(currentGame.moveHistory), move], reconciledClocks);
      }
    },
    [applyMove, syncFromServer],
  );

  const handleResign = useCallback(
    (payload: ResignEvent) => {
      applyResignation(payload.boardSide, payload.losingColor);
    },
    [applyResignation],
  );

  const handleGameOver = useCallback(
    (payload: GameOverEvent) => {
      setGameOver({
        board: payload.board,
        reason: payload.reason,
        losingColor: payload.losingColor,
      });
    },
    [setGameOver],
  );

  const handleClockSync = useCallback(
    (payload: ClockSyncEvent) => {
      const currentClocks = useGameStore.getState().clocksMs;
      const reconciledClocks: Record<string, number> = { ...currentClocks };
      for (const [id, ms] of Object.entries(payload.clocks)) {
        reconciledClocks[id] = Math.min(reconciledClocks[id] ?? ms, ms);
      }
      const { game: currentGame } = useGameStore.getState();
      if (currentGame) {
        syncFromServer(
          currentGame.boardA,
          currentGame.boardB,
          currentGame.moveHistory,
          reconciledClocks,
        );
      }
    },
    [syncFromServer],
  );

  useEffect(() => {
    subscribeToGame(gameId, {
      onMove: handleMove,
      onResign: handleResign,
      onGameOver: handleGameOver,
      onClockSync: handleClockSync,
      onReconnect: loadFromDb,
    });

    return () => {
      unsubscribeFromGame();
    };
  }, [gameId, handleMove, handleResign, handleGameOver, handleClockSync, loadFromDb]);

  // Periodic clock sync broadcast (only my clocks)
  useEffect(() => {
    if (!game || game.status !== 'active') return;

    clockSyncTimer.current = setInterval(async () => {
      await broadcastClockSync(gameId, clocksMs);
    }, CLOCK_SYNC_INTERVAL_MS);

    return () => {
      if (clockSyncTimer.current) clearInterval(clockSyncTimer.current);
    };
  }, [gameId, game, clocksMs]);

  const sendMove = useCallback(
    async (move: GameMove) => {
      const { game: currentGame, engine: currentEngine } = useGameStore.getState();
      if (!currentGame || !currentEngine) return false;

      // Optimistic apply
      applyMove(move);

      const states = currentEngine.getBothBoardStates();
      await broadcastMove(gameId, {
        move,
        boardA: states.A,
        boardB: states.B,
        clocks: useGameStore.getState().clocksMs,
      });

      return true;
    },
    [gameId, applyMove],
  );

  const sendResign = useCallback(
    async (boardSide: BoardSide, losingColor: Color) => {
      applyResignation(boardSide, losingColor);
      await broadcastResign(gameId, {
        boardSide,
        losingColor,
        playerId: myPlayerId,
      });
    },
    [gameId, myPlayerId, applyResignation],
  );

  return { sendMove, sendResign, loadFromDb };
}
