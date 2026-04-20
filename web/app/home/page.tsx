'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId, getDisplayName } from '@/lib/identity';
import { httpUrl } from '@/lib/serverUrl';

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
      const res = await fetch(
        `${httpUrl()}/test-game?userId=${encodeURIComponent(userId)}&displayName=${encodeURIComponent(displayName)}`
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-xl flex flex-col gap-4 mx-4 sm:mx-0">
        <h1 className="text-2xl font-bold text-center">Bughouse Chess</h1>
        <p className="text-gray-400 text-center text-sm">Playing as <span className="text-gray-200 font-medium">{displayName}</span></p>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={startTestGame}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
        >
          {loading ? 'Starting...' : 'Quick Play vs Bots'}
        </button>

        <button
          onClick={() => router.push('/lobbies')}
          className="bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors"
        >
          Browse Lobbies
        </button>

        <button
          onClick={() => router.push('/name-entry')}
          className="text-gray-400 hover:text-gray-200 text-sm text-center transition-colors"
        >
          Change Display Name
        </button>
      </div>
    </div>
  );
}
