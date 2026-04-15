const raw = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

/** HTTP base URL, e.g. http://localhost:3001 */
export function httpUrl(): string {
  return raw.replace(/\/$/, '');
}

/** WebSocket base URL, e.g. ws://localhost:3001 */
export function wsUrl(): string {
  return raw
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, '');
}
