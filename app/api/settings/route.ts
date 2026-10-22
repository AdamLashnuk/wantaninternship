import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../../../lib/auth';
import { settingsEndpoint } from '../../../lib/settings-api';
export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest) {
  if (request.method !== 'GET' && request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const session = await getSession();
    if (!session.user || !session.accessToken) return NextResponse.json({ error: 'Please log in to manage settings.' }, { status: 401 });
    const url = settingsEndpoint();
    if (!url) return NextResponse.json({ error: 'Personal matching is being set up.' }, { status: 503 });
    const body = request.method === 'GET' ? undefined : await request.text();
    if (body && Buffer.byteLength(body) > 150000) return NextResponse.json({ error: 'Settings are too large.' }, { status: 413 });
    const upstream = await fetch(url, { method: request.method, headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }, body, cache: 'no-store', signal: AbortSignal.timeout(20000) });
    const response = NextResponse.json(await upstream.json(), { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
    if (session.tokens) setSession(response, session.tokens);
    return response;
  } catch { return NextResponse.json({ error: 'Unable to reach your settings. Please try again after the backend is deployed.' }, { status: 503 }); }
}
export const GET = proxy;
export const PUT = proxy;
export const POST = proxy;
export const DELETE = proxy;
