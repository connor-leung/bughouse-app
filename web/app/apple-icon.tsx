import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1829',
          borderRadius: '40px',
        }}
      >
        {/* Top-left quadrant */}
        <div style={{ position: 'absolute', top: 28, left: 28, width: 56, height: 56, background: '#2d6ff0', borderRadius: 10, display: 'flex' }} />
        {/* Top-right quadrant */}
        <div style={{ position: 'absolute', top: 28, right: 28, width: 56, height: 56, background: '#3e5a80', borderRadius: 10, display: 'flex' }} />
        {/* Bottom-left quadrant */}
        <div style={{ position: 'absolute', bottom: 28, left: 28, width: 56, height: 56, background: '#3e5a80', borderRadius: 10, display: 'flex' }} />
        {/* Bottom-right quadrant */}
        <div style={{ position: 'absolute', bottom: 28, right: 28, width: 56, height: 56, background: '#2d6ff0', borderRadius: 10, display: 'flex' }} />
        {/* Center knight */}
        <div style={{ fontSize: 64, color: '#ffffff', display: 'flex' }}>♞</div>
      </div>
    ),
    { ...size }
  );
}
