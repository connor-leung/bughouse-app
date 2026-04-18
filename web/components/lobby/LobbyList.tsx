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
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/home')} className="text-gray-400 hover:text-gray-200">
            ← Back
          </button>
          <h1 className="text-xl font-bold">Lobbies</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          + Create
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {waitingLobbies.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="text-lg">No open lobbies</p>
          <p className="text-sm mt-1">Create one to get started</p>
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
          onCreate={(name, tc) => {
            actions?.createLobby(name, tc);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
