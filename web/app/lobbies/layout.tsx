'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId, getDisplayName, hasDisplayName } from '@/lib/identity';
import { useLobbySocket } from '@/lib/hooks/useLobbySocket';
import { useLobbyStore } from '@/store/lobbyStore';

export default function LobbiesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userId = getUserId();
  const displayName = getDisplayName();
  const pendingGame = useLobbyStore((s) => s.pendingGame);
  const clearPendingGame = useLobbyStore((s) => s.setPendingGame);
  const pendingLobbyId = useLobbyStore((s) => s.pendingLobbyId);
  const clearPendingLobbyId = useLobbyStore((s) => s.setPendingLobbyId);

  // Guard: redirect if no name set
  useEffect(() => {
    if (!hasDisplayName()) router.replace('/name-entry');
  }, [router]);

  // Mount the lobby WebSocket for this entire section
  useLobbySocket(userId, displayName);

  // Navigate to lobby room after creating a lobby
  useEffect(() => {
    if (pendingLobbyId) {
      clearPendingLobbyId(null);
      router.push(`/lobbies/${pendingLobbyId}`);
    }
  }, [pendingLobbyId, clearPendingLobbyId, router]);

  // Navigate when a game starts
  useEffect(() => {
    if (pendingGame) {
      clearPendingGame(null);
      router.push(`/game/${pendingGame.gameId}`);
    }
  }, [pendingGame, clearPendingGame, router]);

  return <>{children}</>;
}
