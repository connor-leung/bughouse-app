import { ImageResponse } from 'next/og';

export const alt = 'Bughouse Chess — 4-player online chess';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function MiniBoard({ cell, flip }: { cell: number; flip?: boolean }) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    const squares = [];
    for (let f = 0; f < 8; f++) {
      const light = (r + f) % 2 === (flip ? 1 : 0);
      squares.push(
        <div key={f} style={{ width: cell, height: cell, background: light ? '#c5d3e8' : '#3e5a80', display: 'flex' }} />
      );
    }
    rows.push(<div key={r} style={{ display: 'flex' }}>{squares}</div>);
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        border: '4px solid rgba(255,255,255,0.08)',
      }}
    >
      {rows}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 72px',
          background: '#080e1a',
          color: '#e8eef8',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 560 }}>
          <div style={{ fontSize: 30, color: '#4a86f5', fontWeight: 700, display: 'flex' }}>Bughouse Chess</div>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginTop: 24, display: 'flex' }}>
            4-player chess, live in your browser
          </div>
          <div style={{ fontSize: 30, color: '#7a8fae', marginTop: 28, display: 'flex' }}>
            Free · Real-time · No account required
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <MiniBoard cell={38} />
          <MiniBoard cell={26} flip />
        </div>
      </div>
    ),
    { ...size }
  );
}
