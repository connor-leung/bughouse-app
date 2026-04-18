'use client';

import { useCallback, useEffect, useRef } from 'react';
import { wsUrl } from '@/lib/serverUrl';
import { BoardRole, ChatMessage, GameResult, GameState, WsEnvelope } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

function send(ws: WebSocket | null, type: string, data?: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

export function useGameSocket(gameId: string, userId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useGameStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!gameId || !userId) return;

    const url = `${wsUrl()}/game/${gameId}?userId=${encodeURIComponent(userId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      store.setConnected(true);
      store.setError(null);
    };

    ws.onmessage = (e) => {
      const msg: WsEnvelope = JSON.parse(e.data);
      switch (msg.type) {
        case 'game:state':
        case 'game:update': {
          const state = msg.data as GameState;
          if (state.gameId !== gameId) break;
          store.setGameState(state);
          if (!store.myRole) {
            const slot = state.players.find((p) => p.userId === userId);
            if (slot) store.setMyRole(slot.role as BoardRole);
          }
          break;
        }
        case 'game:ended': {
          store.setGameResult(msg.data as GameResult);
          break;
        }
        case 'game:message': {
          store.appendChat(msg.data as ChatMessage);
          break;
        }
        case 'error': {
          const data = msg.data as { message: string };
          store.setError(data.message ?? String(msg.data));
          break;
        }
      }
    };

    ws.onerror = () => store.setError('Connection error');
    ws.onclose = () => store.setConnected(false);

    return () => {
      isMounted.current = false;
      ws.close();
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

  return { sendMove, sendMove2, sendDrop, resign, sendMessage };
}
