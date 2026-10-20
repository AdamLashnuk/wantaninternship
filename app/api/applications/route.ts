import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";
async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await getSession();
    if (!session.user || !session.accessToken) return NextResponse.json({ error: "Please log in to save internships." }, { status: 401 });
    const base = process.env.APPLICATIONS_API_URL || process.env.INTERNSHIPS_API_URL;
    if (!base) return NextResponse.json({ error: "Your application tracker is being set up. Please try again soon." }, { status: 503 });
    const url = new URL(base);
    url.pathname = url.pathname.replace(/\/internships\/?$/, "/applications"); url.search = "";
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && body.length > 16000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const upstream = await fetch(url, { method: request.method, headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body, cache: "no-store", signal: AbortSignal.timeout(20000) });
    const payload = await upstream.json();
    const response = NextResponse.json(payload, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    if (session.tokens) setSession(response, session.tokens);
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to reach your application tracker. Please try again." }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
