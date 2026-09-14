import { NextRequest, NextResponse } from "next/server";
import type { InternshipJob, InternshipResponse } from "../../../lib/internships";

export const revalidate = 300;

function isInternshipJob(value: unknown): value is InternshipJob {
  if (!value || typeof value !== "object") return false;

  const job = value as Record<string, unknown>;
  return (
    typeof job.id === "string" &&
    typeof job.company === "string" &&
    typeof job.title === "string" &&
    typeof job.location === "string" &&
    typeof job.applyUrl === "string" &&
    typeof job.source === "string" &&
    typeof job.firstSeenAt === "string"
  );
}

export async function GET(request: NextRequest) {
  const requestedTrack = request.nextUrl.searchParams.get("track") ?? "software";

  if (requestedTrack !== "software") {
    return NextResponse.json(
      { error: "Live internship drops are currently available for Software only." },
      { status: 400 },
    );
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
    : 25;
  const apiUrl = process.env.INTERNSHIPS_API_URL;

  if (!apiUrl) {
    return NextResponse.json<InternshipResponse>({ jobs: [], live: false });
  }

  try {
    const upstreamUrl = new URL(apiUrl);
    upstreamUrl.searchParams.set("limit", String(limit));

    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Internship API returned ${response.status}`);
    }

    const payload = (await response.json()) as { jobs?: unknown; updatedAt?: unknown };
    const jobs = Array.isArray(payload.jobs)
      ? payload.jobs.filter(isInternshipJob).slice(0, limit)
      : [];

    return NextResponse.json<InternshipResponse>({
      jobs,
      live: true,
      updatedAt:
        typeof payload.updatedAt === "string" ? payload.updatedAt : undefined,
    });
  } catch (error) {
    console.error("Unable to load live internships", error);
    return NextResponse.json<InternshipResponse>({ jobs: [], live: false });
  }
}
