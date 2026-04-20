import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  const secret = process.env.WS_SECRET;
  if (!secret) {
    // Local dev — return a placeholder; server also skips validation when unset
    return NextResponse.json({ ticket: '' });
  }

  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHmac('sha256', secret).update(ts).digest('hex');
  return NextResponse.json({ ticket: `${ts}.${sig}` });
}
