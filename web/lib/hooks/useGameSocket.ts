'use client';

import { useCallback, useEffect, useRef } from 'react';
import { wsUrl, fetchWsTicket } from '@/lib/serverUrl';
import { BoardRole, ChatMessage, GameResult, GameState, WsEnvelope } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

function send(ws: WebSocket | null, type: string, data?: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence for game-over state
// These events are sent once and never re-broadcast on reconnect, so we
// save them locally and restore on reload.
// ---------------------------------------------------------------------------

interface PersistedGameState {
  gameResult?: GameResult;
  rematchVotes?: string[];
  myRole?: BoardRole;
}

function persistKey(gameId: string) {
  return `bughouse:game:${gameId}`;
}

function loadPersistedState(gameId: string): PersistedGameState {
  try {
    const raw = localStorage.getItem(persistKey(gameId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePersistedState(gameId: string, patch: Partial<PersistedGameState>) {
  try {
    const existing = loadPersistedState(gameId);
    localStorage.setItem(persistKey(gameId), JSON.stringify({ ...existing, ...patch }));
  } catch { /* storage unavailable */ }
}

export function useGameSocket(gameId: string, userId: string) {
  const wsRef = useRef<WebSocket | null>(null);

  // Access the store via getState() for use outside React render cycle
  // (WebSocket handlers are not React event handlers, so using the store
  // snapshot from the closure can be stale).
  const gs = useGameStore;

  useEffect(() => {
    let active = true;
    if (!gameId || !userId) return;

    console.log('[game] resetGame for', gameId);
    gs.getState().resetGame();

    // Restore one-time events (game:ended, rematch votes) that won't be
    // re-sent by the server on reconnect.
    const saved = loadPersistedState(gameId);
    if (saved.gameResult) gs.getState().setGameResult(saved.gameResult);
    if (saved.rematchVotes) gs.getState().setRematchVotes(saved.rematchVotes);
    if (saved.myRole) gs.getState().setMyRole(saved.myRole);

    (async () => {
      const ticket = await fetchWsTicket();
      if (!active) return;
      const url = `${wsUrl()}/game/${gameId}?userId=${encodeURIComponent(userId)}${ticket ? `&ticket=${encodeURIComponent(ticket)}` : ''}`;
      console.log('[game] creating WebSocket to', url);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        console.log('[game] ws connected to', gameId);
        gs.getState().setConnected(true);
        gs.getState().setError(null);
      };

      ws.onmessage = (e) => {
        if (!active) return;
        const msg: WsEnvelope = JSON.parse(e.data);
        console.log('[game] received', msg.type);
        switch (msg.type) {
          case 'game:state':
          case 'game:update': {
            const state = msg.data as GameState;
            if (state.gameId !== gameId) {
              console.log('[game] ignoring', msg.type, 'for', state.gameId, '(expected', gameId + ')');
              break;
            }
            gs.getState().setPendingRematch(null);
            gs.getState().setGameState(state);
            if (!gs.getState().myRole) {
              const slot = state.players.find((p) => p.userId === userId);
              if (slot) {
                gs.getState().setMyRole(slot.role as BoardRole);
                savePersistedState(gameId, { myRole: slot.role as BoardRole });
              }
            }
            break;
          }
          case 'game:ended': {
            const result = msg.data as GameResult;
            gs.getState().setGameResult(result);
            savePersistedState(gameId, { gameResult: result });
            break;
          }
          case 'game:rematch_votes': {
            const data = msg.data as { votes: string[] };
            gs.getState().setRematchVotes(data.votes ?? []);
            savePersistedState(gameId, { rematchVotes: data.votes ?? [] });
            break;
          }
          case 'game:starting': {
            const data = msg.data as { gameId: string; role: BoardRole };
            console.log('[game] received game:starting', data.gameId);
            gs.getState().setPendingRematch(data);
            break;
          }
          case 'game:message': {
            gs.getState().appendChat(msg.data as ChatMessage);
            break;
          }
          case 'error': {
            const data = msg.data as { message: string };
            console.log('[game] received error:', data.message);
            gs.getState().setError(data.message ?? String(msg.data));
            break;
          }
        }
      };

      ws.onerror = () => {
        if (!active) return;
        console.log('[game] ws error');
        gs.getState().setError('Connection error');
      };
      ws.onclose = (e) => {
        if (!active) return;
        console.log('[game] ws closed', e.code, e.reason);
        gs.getState().setConnected(false);
      };
    })();

    return () => {
      active = false;
      wsRef.current?.close();
    };
  }, [gameId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      send(wsRef.current, 'game:move', { board: '1', from, to, ...(promotion ? { promotion } : {}) });
    },
    []
  );

  const sendMove2 = useCallback(
    (from: string, to: string, promotion?: string) => {
      send(wsRef.current, 'game:move', { board: '2', from, to, ...(promotion ? { promotion } : {}) });
    },
    []
  );

  const sendDrop = useCallback((board: '1' | '2', pieceRole: string, to: string) => {
    send(wsRef.current, 'game:drop', { board, pieceRole, to });
  }, []);

  const resign = useCallback(() => {
    send(wsRef.current, 'game:resign');
  }, []);

  const sendMessage = useCallback((text: string) => {
    send(wsRef.current, 'game:message', { text });
  }, []);

  const sendRematch = useCallback(() => {
    send(wsRef.current, 'game:rematch');
  }, []);

  return { sendMove, sendMove2, sendDrop, resign, sendMessage, sendRematch };
}
