'use client';

import { useEffect } from 'react';
import { wsUrl } from '@/lib/serverUrl';
import { BoardRole, Lobby, TimeControl, WsEnvelope } from '@/lib/types';
import { useLobbyStore } from '@/store/lobbyStore';

export function useLobbySocket(userId: string, displayName: string) {
  const store = useLobbyStore();

  useEffect(() => {
    if (!userId || !displayName) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function send(type: string, data?: unknown) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
      }
    }

    function connect() {
      if (destroyed) return;
      const url = `${wsUrl()}/lobby?userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        store.setConnected(true);
        store.setError(null);
        send('lobby:list');
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
            store.setPendingGame(msg.data as { gameId: string; role: BoardRole });
            break;
          }
          case 'lobby:error': {
            const data = msg.data as { message: string };
            store.setError(data.message);
            break;
          }
        }
      };

      ws.onerror = () => store.setError('Connection error');

      ws.onclose = () => {
        store.setConnected(false);
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    store.setActions({
      createLobby: (name: string, timeControl: TimeControl) =>
        send('lobby:create', { name, timeControl }),
      joinLobby: (lobbyId: string, slotIndex: number) =>
        send('lobby:join', { lobbyId, slotIndex }),
      leaveLobby: (lobbyId: string) =>
        send('lobby:leave', { lobbyId }),
      startGame: (lobbyId: string) =>
        send('lobby:start', { lobbyId }),
    });

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      store.setConnected(false);
      store.setActions(null);
      // If still connecting, onclose will fire but destroyed=true prevents reconnect
      ws?.close();
    };
  }, [userId, displayName]); // eslint-disable-line react-hooks/exhaustive-deps
}
