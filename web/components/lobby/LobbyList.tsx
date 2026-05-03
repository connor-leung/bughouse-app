'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLobbyStore } from '@/store/lobbyStore';
import LobbyCard from './LobbyCard';
import CreateLobbyModal from './CreateLobbyModal';

export default function LobbyList() {
  const router = useRouter();
  const lobbies = useLobbyStore((s) => s.lobbies);
  const error = useLobbyStore((s) => s.error);
  const isConnected = useLobbyStore((s) => s.isConnected);
  const actions = useLobbyStore((s) => s.actions);
  const [showCreate, setShowCreate] = useState(false);

  function handleJoin(lobbyId: string, slotIndex: number) {
    if (slotIndex === -1) return;
    actions?.joinLobby(lobbyId, slotIndex);
    router.push(`/lobbies/${lobbyId}`);
  }

  const waitingLobbies = lobbies.filter((l) => l.status === 'waiting');

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto bg-base">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/home')} className="text-muted hover:text-primary text-sm transition-colors">
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-primary">Lobbies</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${isConnected ? 'bg-success/12 text-success border-success/25' : 'bg-elevated text-muted border-white/7'}`}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-accent hover:bg-accent-bright rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-[0_2px_12px_rgba(45,111,240,0.25)]"
        >
          + Create
        </button>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/25 rounded-lg p-3 mb-4 text-danger text-sm">
          {error}
        </div>
      )}

      {waitingLobbies.length === 0 ? (
        <div className="text-center text-muted py-16">
          <p className="text-base">No open lobbies</p>
          <p className="text-sm mt-1 text-muted">Create one to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {waitingLobbies.map((lobby) => (
            <LobbyCard
              key={lobby.id}
              lobby={lobby}
              onJoin={(slotIndex) => handleJoin(lobby.id, slotIndex)}
              onView={() => router.push(`/lobbies/${lobby.id}`)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateLobbyModal
          onClose={() => setShowCreate(false)}
          onCreate={(name, tc, randomTeams) => {
            actions?.createLobby(name, tc, randomTeams);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
