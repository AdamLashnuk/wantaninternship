import { NextResponse } from "next/server";
import { accountsConfigured, clearSession, getSession, setSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const response = NextResponse.json({ user: session.user, configured: accountsConfigured() }, { headers: { "Cache-Control": "no-store, private" } });
    if (session.tokens) setSession(response, session.tokens);
    else if (!session.user) clearSession(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Account services are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store, private" } });
  }
}
