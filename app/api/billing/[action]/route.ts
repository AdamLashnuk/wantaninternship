import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(_request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return NextResponse.json(action === "status" ? { premium: true, complimentary: true, status: "free", billingReady: false, trialEligible: false } : { error: "Payments are disabled. WantAnInternship is free." }, { status: action === "status" ? 200 : 410, headers: { "Cache-Control": "no-store" } });
}
export async function POST() { return NextResponse.json({ error: "Payments are disabled. WantAnInternship is free." }, { status: 410 }); }
