import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession } from '../../../../lib/auth';
import { extractResume } from '../../../../lib/resume-text';
import { settingsEndpoint } from '../../../../lib/settings-api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const session = await getSession();
    if (!session.user || !session.accessToken) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
    const endpoint = settingsEndpoint();
    if (!endpoint) return NextResponse.json({ error: 'Personal matching is being set up.' }, { status: 503 });
    const access = await fetch(endpoint, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!access.ok || !(await access.json()).allowed) return NextResponse.json({ error: 'Personal matching is not enabled for this account yet.' }, { status: 403 });
    if (Number(request.headers.get('content-length')) > 2 * 1024 * 1024 + 10000) return NextResponse.json({ error: 'Use a resume smaller than 2 MB.' }, { status: 413 });
    const form = await request.formData(); const file = form.get('resume');
    if (!(file instanceof File) || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Upload a PDF, DOCX, or TXT resume under 2 MB.' }, { status: 400 });
    const text = await extractResume(file.name, new Uint8Array(await file.arrayBuffer()));
    const response = NextResponse.json({ text, name: file.name.slice(0, 120) }, { headers: { 'Cache-Control': 'no-store' } });
    if (session.tokens) setSession(response, session.tokens);
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error && /resume|DOCX|PDF|text|document|pages|Upload/.test(error.message) ? error.message : 'Unable to read this resume. Try pasting the text instead.' }, { status: 400 }); }
}
