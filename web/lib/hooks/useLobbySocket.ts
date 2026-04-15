'use client';

import { useCallback, useEffect, useRef } from 'react';
import { wsUrl } from '@/lib/serverUrl';
import { BoardRole, Lobby, TimeControl, WsEnvelope } from '@/lib/types';
import { useLobbyStore } from '@/store/lobbyStore';

function send(ws: WebSocket | null, type: string, data?: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

export function useLobbySocket(userId: string, displayName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useLobbyStore();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!userId || !displayName) return;
    const url = `${wsUrl()}/lobby?userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      store.setConnected(true);
      store.setError(null);
      send(ws, 'lobby:list');
    };

    ws.onmessage = (e) => {
      const msg: WsEnvelope = JSON.parse(e.data);
      switch (msg.type) {
        case 'lobby:list': {
          const data = msg.data as { lobbies: Lobby[] };
          store.setLobbies(data.lobbies ?? []);
          break;
        }
        case 'lobby:created':
        case 'lobby:updated': {
          store.upsertLobby(msg.data as Lobby);
          break;
        }
        case 'game:starting': {
          const data = msg.data as { gameId: string; role: BoardRole };
          store.setPendingGame(data);
          break;
        }
        case 'lobby:error': {
          const data = msg.data as { message: string };
          store.setError(data.message);
          break;
        }
      }
    };

    ws.onerror = () => {
      store.setError('Connection error');
    };

    ws.onclose = () => {
      store.setConnected(false);
      if (isMounted.current) {
        reconnectTimer.current = setTimeout(() => connect(), 3000);
      }
    };
  }, [userId, displayName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const createLobby = useCallback(
    (name: string, timeControl: TimeControl) => {
      send(wsRef.current, 'lobby:create', { name, timeControl });
    },
    []
  );

  const joinLobby = useCallback((lobbyId: string, slotIndex: number) => {
    send(wsRef.current, 'lobby:join', { lobbyId, slotIndex });
  }, []);

  const leaveLobby = useCallback((lobbyId: string) => {
    send(wsRef.current, 'lobby:leave', { lobbyId });
  }, []);

  const startGame = useCallback((lobbyId: string) => {
    send(wsRef.current, 'lobby:start', { lobbyId });
  }, []);

  return { createLobby, joinLobby, leaveLobby, startGame };
}
