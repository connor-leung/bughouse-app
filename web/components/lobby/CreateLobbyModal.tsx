'use client';

import { useState } from 'react';
import { TimeControl } from '@/lib/types';

const PRESETS: TimeControl[] = [
  { minutes: 1, incrementSeconds: 0 },
  { minutes: 2, incrementSeconds: 1 },
  { minutes: 3, incrementSeconds: 0 },
  { minutes: 5, incrementSeconds: 0 },
  { minutes: 10, incrementSeconds: 0 },
];

interface Props {
  onClose: () => void;
  onCreate: (name: string, tc: TimeControl, randomTeams: boolean) => void;
}

export default function CreateLobbyModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [tc, setTc] = useState<TimeControl>(PRESETS[2]);
  const [randomTeams, setRandomTeams] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim() || 'New Lobby';
    onCreate(trimmed, tc, randomTeams);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Create Lobby</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            placeholder="Lobby name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <p className="text-sm text-gray-400 mb-2">Time control</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const label = p.incrementSeconds > 0 ? `${p.minutes}+${p.incrementSeconds}` : `${p.minutes}+0`;
                const active = tc.minutes === p.minutes && tc.incrementSeconds === p.incrementSeconds;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTc(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setRandomTeams((v) => !v)}
              className="flex items-center gap-2 w-full"
            >
              <div className={`w-9 h-5 rounded-full transition-colors ${randomTeams ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${randomTeams ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">Random teams</span>
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
