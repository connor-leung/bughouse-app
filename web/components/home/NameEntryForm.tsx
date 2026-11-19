'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setDisplayName, hasDisplayName } from '@/lib/identity';

export default function NameEntryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasDisplayName()) router.replace('/home');
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a display name.');
      return;
    }
    setDisplayName(trimmed);
    router.push('/home');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-xl mx-4 sm:mx-0">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Bughouse</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            placeholder="Display name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            maxLength={32}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-semibold transition-colors"
          >
            Start Playing
          </button>
        </form>
      </div>
    </div>
  );
}
