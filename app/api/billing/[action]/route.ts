import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "../../../../lib/auth";
export const dynamic = "force-dynamic";
async function proxy(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!["status", "checkout", "portal", "redeem"].includes(action)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if ((request.method === "GET") !== (action === "status")) return NextResponse.json({ error: "Unsupported request." }, { status: 405 });
  if (request.method !== "GET" && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const session = await getSession();
    if (!session.user || !session.accessToken) return NextResponse.json({ error: "Please log in to manage your subscription." }, { status: 401 });
    const base = process.env.BILLING_API_URL || process.env.INTERNSHIPS_API_URL;
    if (!base) return NextResponse.json({ error: "Subscriptions are being set up. Please try again soon." }, { status: 503 });
    const url = new URL(base); url.pathname = url.pathname.replace(/\/(internships|billing)\/?$/, "") + `/billing/${action}`; url.search = "";
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && body.length > 4000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const upstream = await fetch(url, { method: request.method, headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body, cache: "no-store", signal: AbortSignal.timeout(55000) });
    const result = await upstream.json();
    const response = NextResponse.json(result, { status: upstream.status, headers: { "Cache-Control": "private, no-store" } });
    if (session.tokens) setSession(response, session.tokens);
    return response;
  } catch { return NextResponse.json({ error: "Billing is temporarily unavailable. Please try again." }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
