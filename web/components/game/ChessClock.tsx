'use client';

interface Props {
  ms: number;
  isActive: boolean;
  label?: string;
}

function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) {
    const secs = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${secs}.${tenths}`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ChessClock({ ms, isActive, label }: Props) {
  const isLow = ms < 10_000 && ms > 0;
  const isDead = ms <= 0;

  return (
    <div className={`flex flex-col items-center rounded-xl px-3 py-2 min-w-[80px] transition-colors
      ${isDead ? 'bg-elevated border border-white/7 text-muted' : isActive ? isLow ? 'bg-danger text-white' : 'bg-accent text-white' : 'bg-elevated border border-white/7 text-secondary'}`}>
      {label && <span className="text-xs font-medium opacity-70 mb-0.5 font-sans">{label}</span>}
      <span className={`font-mono font-bold tabular-nums ${isLow ? 'text-2xl' : 'text-xl'}`}>
        {formatMs(ms)}
      </span>
    </div>
  );
}
