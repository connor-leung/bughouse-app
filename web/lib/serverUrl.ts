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

/** Fetches a short-lived HMAC ticket from the Next.js API route for WebSocket auth. */
export async function fetchWsTicket(): Promise<string> {
  try {
    const res = await fetch('/api/ws-ticket');
    const { ticket } = await res.json();
    return ticket ?? '';
  } catch {
    return '';
  }
}
