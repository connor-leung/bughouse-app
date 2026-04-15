'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/store/lobbyStore';
import { useLobbySocket } from '@/lib/hooks/useLobbySocket';
import { getUserId, getDisplayName } from '@/lib/identity';
import { BoardRole, Lobby } from '@/lib/types';
import PlayerSlotTile from './PlayerSlotTile';

const TEAM_A_ROLES: BoardRole[] = ['board1White', 'board2Black'];
const TEAM_B_ROLES: BoardRole[] = ['board1Black', 'board2White'];

interface Props {
  lobbyId: string;
}

function TeamSection({
  title,
  roles,
  lobby,
  userId,
  onJoin,
}: {
  title: string;
  roles: BoardRole[];
  lobby: Lobby;
  userId: string;
  onJoin: (role: BoardRole, slotIndex: number) => void;
}) {
  const ROLE_ORDER: BoardRole[] = ['board1White', 'board1Black', 'board2White', 'board2Black'];
  return (
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-col gap-2">
        {roles.map((role) => {
          const slotIndex = ROLE_ORDER.indexOf(role);
          const slot = lobby.slots[slotIndex] ?? null;
          return (
            <PlayerSlotTile
              key={role}
              role={role}
              slot={slot}
              isMe={slot?.userId === userId}
              onJoin={() => onJoin(role, slotIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function LobbyRoom({ lobbyId }: Props) {
  const router = useRouter();
  const userId = getUserId();
  const displayName = getDisplayName();
  const { leaveLobby, startGame } = useLobbySocket(userId, displayName);
  const lobby = useLobbyStore((s) => s.lobbies.find((l) => l.id === lobbyId) ?? s.currentLobby);
  const { joinLobby } = useLobbySocket(userId, displayName);

  // Set current lobby in store when we find it
  const setCurrentLobby = useLobbyStore((s) => s.setCurrentLobby);
  useEffect(() => {
    if (lobby) setCurrentLobby(lobby);
  }, [lobby, setCurrentLobby]);

  function handleLeave() {
    leaveLobby(lobbyId);
    router.push('/lobbies');
  }

  function handleJoin(role: BoardRole, slotIndex: number) {
    joinLobby(lobbyId, slotIndex);
  }

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading lobby...
      </div>
    );
  }

  const filled = lobby.slots.filter(Boolean).length;
  const isFull = filled === 4;
  const isHost = lobby.hostUserId === userId;
  const { minutes, incrementSeconds } = lobby.timeControl;
  const tcLabel = incrementSeconds > 0 ? `${minutes}+${incrementSeconds}` : `${minutes}+0`;

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleLeave} className="text-gray-400 hover:text-gray-200">
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold">{lobby.name}</h1>
          <p className="text-sm text-gray-400">{tcLabel} min &middot; {filled}/4 players</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <TeamSection
          title="Team A"
          roles={TEAM_A_ROLES}
          lobby={lobby}
          userId={userId}
          onJoin={handleJoin}
        />
        <TeamSection
          title="Team B"
          roles={TEAM_B_ROLES}
          lobby={lobby}
          userId={userId}
          onJoin={handleJoin}
        />
      </div>

      {isHost && (
        <button
          onClick={() => startGame(lobbyId)}
          disabled={!isFull}
          className="mt-8 w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-bold text-lg transition-colors"
        >
          {isFull ? 'Start Game' : `Waiting for players (${filled}/4)`}
        </button>
      )}
      {!isHost && !isFull && (
        <p className="mt-8 text-center text-gray-500 text-sm">
          Waiting for host to start ({filled}/4 players)
        </p>
      )}
    </div>
  );
}
