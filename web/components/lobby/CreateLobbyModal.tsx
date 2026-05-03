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
    <div className="fixed inset-0 bg-base/80 backdrop-blur-xl flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface border border-white/12 rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-5 text-primary">Create Lobby</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            placeholder="Lobby name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="w-full bg-elevated border border-accent rounded-lg px-4 py-2.5 text-primary placeholder-muted focus:outline-none focus:border-accent-bright transition-colors"
          />

          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Time control</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const label = p.incrementSeconds > 0 ? `${p.minutes}+${p.incrementSeconds}` : `${p.minutes}+0`;
                const active = tc.minutes === p.minutes && tc.incrementSeconds === p.incrementSeconds;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTc(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${active ? 'bg-accent text-white border-transparent' : 'bg-elevated text-secondary hover:bg-hover border-white/7'}`}
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
              <div className={`w-9 h-5 rounded-full transition-colors border ${randomTeams ? 'bg-accent' : 'bg-elevated border-white/7'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${randomTeams ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-primary font-medium">Random teams</span>
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-elevated hover:bg-hover border border-white/7 rounded-lg py-2.5 text-sm font-medium transition-colors text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent-bright rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-[0_2px_12px_rgba(45,111,240,0.25)]"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
