'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/store/lobbyStore';
import { getUserId } from '@/lib/identity';
import { BoardRole, Lobby } from '@/lib/types';
import PlayerSlotTile from './PlayerSlotTile';

const TEAM_A_ROLES: BoardRole[] = ['board1White', 'board2Black'];
const TEAM_B_ROLES: BoardRole[] = ['board1Black', 'board2White'];
const ROLE_ORDER: BoardRole[] = ['board1White', 'board1Black', 'board2White', 'board2Black'];

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
  return (
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-col gap-2">
        {roles.map((role) => {
          const slotIndex = ROLE_ORDER.indexOf(role);
          const slot = lobby.slots[slotIndex] ?? null;
          const isReady = slot ? (lobby.readyPlayerIds ?? []).includes(slot.userId) : false;
          return (
            <PlayerSlotTile
              key={role}
              role={role}
              slot={slot}
              isMe={slot?.userId === userId}
              isReady={isReady}
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
  const actions = useLobbyStore((s) => s.actions);
  const lobby = useLobbyStore((s) => s.lobbies.find((l) => l.id === lobbyId) ?? s.currentLobby);
  const setCurrentLobby = useLobbyStore((s) => s.setCurrentLobby);
  const error = useLobbyStore((s) => s.error);
  const setError = useLobbyStore((s) => s.setError);

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (lobby) setCurrentLobby(lobby);
  }, [lobby, setCurrentLobby]);

  // Drive countdown from lobby status
  useEffect(() => {
    if (lobby?.status === 'starting') {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((n) => (n !== null && n > 1 ? n - 1 : n));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [lobby?.status]);

  function handleLeave() {
    actions?.leaveLobby(lobbyId);
    router.push('/lobbies');
  }

  function handleJoin(_role: BoardRole, slotIndex: number) {
    setError(null);
    actions?.joinLobby(lobbyId, slotIndex);
  }

  function handleReady() {
    setError(null);
    actions?.readyLobby(lobbyId);
  }

  if (!lobby) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <p className="text-gray-500 text-center">Loading lobby...</p>
      </div>
    );
  }

  const filled = lobby.slots.filter(Boolean).length;
  const { minutes, incrementSeconds } = lobby.timeControl;
  const tcLabel = incrementSeconds > 0 ? `${minutes}+${incrementSeconds}` : `${minutes}+0`;
  const randomTeams = lobby.randomTeams;

  const mySlot = lobby.slots.find((s) => s?.userId === userId);
  const imInLobby = !!mySlot;
  const imReady = imInLobby && (lobby.readyPlayerIds ?? []).includes(userId);
  const readyCount = (lobby.readyPlayerIds ?? []).length;
  const isStarting = lobby.status === 'starting';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleLeave} className="text-gray-400 hover:text-gray-200 transition-colors">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold">{lobby.name}</h1>
          <p className="text-sm text-gray-400">
            {tcLabel} &middot; {filled}/4 players
            {randomTeams && <span className="ml-1 text-blue-400">&middot; Random teams</span>}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Player slots */}
      <div className="flex flex-col gap-6 mb-6">
        {randomTeams ? (
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">Players</p>
            <div className="flex flex-col gap-2">
              {ROLE_ORDER.map((role, i) => {
                const slot = lobby.slots[i] ?? null;
                const isReady = slot ? (lobby.readyPlayerIds ?? []).includes(slot.userId) : false;
                return (
                  <PlayerSlotTile
                    key={role}
                    role={role}
                    slot={slot}
                    isMe={slot?.userId === userId}
                    isReady={isReady}
                    onJoin={() => handleJoin(role, i)}
                    hideRole
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <TeamSection title="Team A" roles={TEAM_A_ROLES} lobby={lobby} userId={userId} onJoin={handleJoin} />
            <TeamSection title="Team B" roles={TEAM_B_ROLES} lobby={lobby} userId={userId} onJoin={handleJoin} />
          </>
        )}
      </div>

      {/* Ready / countdown area */}
      {isStarting ? (
        <div className="text-center py-4">
          <p className="text-5xl font-black text-green-400 mb-1">{countdown}</p>
          <p className="text-gray-400 text-sm">All players ready — starting…</p>
        </div>
      ) : imInLobby ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReady}
            className={`w-full rounded-xl py-3 font-bold text-base transition-colors ${
              imReady
                ? 'bg-green-800/60 hover:bg-red-900/60 text-green-300 hover:text-red-300 border border-green-700 hover:border-red-700'
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            {imReady ? 'Unready' : 'Ready'}
          </button>
          <p className="text-center text-gray-500 text-xs">
            {readyCount}/4 ready
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-sm">
          Join a slot to ready up
        </p>
      )}
    </div>
  );
}
