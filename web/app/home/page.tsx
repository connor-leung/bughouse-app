'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId, getDisplayName } from '@/lib/identity';
import { httpUrl, fetchWsTicket } from '@/lib/serverUrl';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(getDisplayName());
  }, []);

  async function startTestGame() {
    setLoading(true);
    setError('');
    try {
      const userId = getUserId();
      const displayName = getDisplayName();
      const ticket = await fetchWsTicket();
      const res = await fetch(
        `${httpUrl()}/test-game?userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}${ticket ? `&ticket=${encodeURIComponent(ticket)}` : ''}`
      );
      if (!res.ok) throw new Error('Failed to create test game');
      const { gameId } = await res.json();
      router.push(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3 w-full max-w-xs px-6">
        <h1 className="text-3xl font-bold text-center text-primary tracking-tight">Bughouse Chess</h1>
        <p className="text-secondary text-center mb-2 text-sm">
          Playing as <span className="text-accent-bright font-semibold">{displayName}</span>
        </p>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={startTestGame}
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-bright disabled:opacity-50 rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(45,111,240,0.3)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" />
          </svg>
          {loading ? 'Starting...' : 'Quick Play vs Bots'}
        </button>

        <button
          onClick={() => router.push('/lobbies')}
          className="w-full bg-elevated hover:bg-hover border border-white/7 hover:border-white/12 rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Browse Lobbies
        </button>

        <button
          onClick={() => router.push('/name-entry')}
          className="text-muted hover:text-secondary text-sm text-center transition-colors"
        >
          Change Display Name
        </button>
      </div>

      <button
        onClick={() => {}}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-elevated hover:bg-hover border border-white/7 text-secondary hover:text-primary flex items-center justify-center text-lg font-bold transition-colors"
      >
        ?
      </button>
    </div>
  );
}
