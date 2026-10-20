import { NextRequest, NextResponse } from "next/server";
import type { EngineeringDiscipline, InternshipJob, InternshipResponse, OpportunityTrack, OpportunityType, SoftwareCategory } from "../../../lib/internships";
import { getSession, setSession } from "../../../lib/auth";
import { getDirectSoftwareJobs } from "../../../lib/direct-software-feed";

export const dynamic = "force-dynamic";

const engineeringDisciplines = new Set<EngineeringDiscipline>([
  "mechanical", "electrical", "civil", "chemical", "aerospace", "biomedical",
  "industrial-manufacturing", "computer-hardware", "environmental", "materials",
  "nuclear", "robotics-mechatronics", "other-engineering",
]);

function normalizeJob(value: unknown, requestedTrack: OpportunityTrack): InternshipJob | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;
  const applicationUrl = typeof job.applicationUrl === "string"
    ? job.applicationUrl
    : typeof job.applyUrl === "string" ? job.applyUrl : "";
  if (typeof job.id !== "string" || typeof job.company !== "string" || typeof job.title !== "string" || typeof job.location !== "string" || !applicationUrl || typeof job.source !== "string" || typeof job.firstSeenAt !== "string") return null;

  const opportunityType: OpportunityType = job.opportunityType === "new-grad" ? "new-grad" : "internship";
  const softwareCategory: SoftwareCategory =
    job.softwareCategory === "data-ai-ml" || job.softwareCategory === "cloud-devops" || job.softwareCategory === "cybersecurity"
      ? job.softwareCategory
      : "swe";
  const engineeringDiscipline = engineeringDisciplines.has(job.engineeringDiscipline as EngineeringDiscipline)
    ? job.engineeringDiscipline as EngineeringDiscipline
    : "other-engineering";

  return {
    ...job,
    id: job.id,
    company: job.company,
    companyWebsite: typeof job.companyWebsite === "string" ? job.companyWebsite : undefined,
    title: job.title,
    opportunityType,
    positionType: job.positionType === "co-op" ? "co-op" : "internship",
    softwareCategory: requestedTrack === "software" ? softwareCategory : undefined,
    engineeringDiscipline: requestedTrack === "engineering" ? engineeringDiscipline : undefined,
    track: requestedTrack,
    location: job.location,
    locations: Array.isArray(job.locations) ? job.locations.filter((item): item is string => typeof item === "string") : [job.location],
    applicationUrl,
    applyUrl: applicationUrl,
    source: job.source,
    sources: Array.isArray(job.sources) ? job.sources.filter((item): item is string => typeof item === "string") : undefined,
    sourceUrl: typeof job.sourceUrl === "string" ? job.sourceUrl : undefined,
    firstSeenAt: job.firstSeenAt,
    postedAt: job.source === "greenhouse" && job.freshnessVersion !== 1
      ? undefined : typeof job.postedAt === "string" ? job.postedAt : undefined,
    sourceUpdatedAt: typeof job.sourceUpdatedAt === "string" ? job.sourceUpdatedAt
      : job.source === "greenhouse" && job.freshnessVersion !== 1 && typeof job.postedAt === "string" ? job.postedAt : undefined,
    freshnessVersion: job.freshnessVersion === 1 ? 1 : undefined,
    active: job.active !== false,
  };
}

export async function GET(request: NextRequest) {
  const requestedTrack = request.nextUrl.searchParams.get("track") ?? "software";
  if (requestedTrack !== "software" && requestedTrack !== "engineering") {
    return NextResponse.json({ error: "Unknown opportunity track." }, { status: 400 });
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 250) : 50;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const apiUrl = process.env.INTERNSHIPS_API_URL;

  if (!apiUrl) {
    const jobs = requestedTrack === "software" ? await getDirectSoftwareJobs(10) : [];
    return NextResponse.json<InternshipResponse>({ jobs, track: requestedTrack, live: false });
  }

  try {
    const preview = request.nextUrl.searchParams.get("preview") === "home";
    const session = preview ? { user: null, accessToken: undefined, tokens: undefined } : await getSession();
    const upstreamUrl = new URL(apiUrl);
    upstreamUrl.searchParams.set("limit", String(limit));
    upstreamUrl.searchParams.set("track", requestedTrack);
    if (cursor) upstreamUrl.searchParams.set("cursor", cursor);
    if (preview) upstreamUrl.searchParams.set("preview", "home");

    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json", ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}) },
      cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Internship API returned ${response.status}`);

    const payload = (await response.json()) as Record<string, unknown>;
    if (requestedTrack === "engineering" && payload.track !== "engineering") {
      return NextResponse.json<InternshipResponse>({ jobs: [], track: requestedTrack, live: false });
    }
    const premium = payload.premium === true && !preview;
    const jobs = Array.isArray(payload.jobs)
      ? payload.jobs.map((job) => normalizeJob(job, requestedTrack)).filter((job): job is InternshipJob => job !== null)
      : [];

    const sourceCounts = payload.sourceCounts && typeof payload.sourceCounts === "object"
      ? payload.sourceCounts as Record<string, number>
      : undefined;
    const countedJobs = sourceCounts
      ? Object.values(sourceCounts).reduce((sum, count) => sum + Number(count ?? 0), 0)
      : undefined;

    const result = NextResponse.json<InternshipResponse>({
      jobs: premium ? jobs : jobs.slice(0, 10),
      premium, preview: !premium,
      track: requestedTrack,
      live: true,
      updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : undefined,
      nextRefreshAt: typeof payload.nextRefreshAt === "string" ? payload.nextRefreshAt : undefined,
      nextCursor: premium && typeof payload.nextCursor === "string" ? payload.nextCursor : undefined,
      sourceCounts,
      totalJobs: typeof payload.totalJobs === "number" ? payload.totalJobs : countedJobs,
      recentWeekJobs: typeof payload.recentWeekJobs === "number" ? payload.recentWeekJobs : undefined,
      retentionDays: typeof payload.retentionDays === "number" ? payload.retentionDays : undefined,
      partial: payload.partial === true,
    }, { headers: { "Cache-Control": "private, no-store" } });
    if (session.tokens) setSession(result, session.tokens);
    return result;
  } catch (error) {
    console.error("Unable to load live internships", error);
    const jobs = requestedTrack === "software" ? await getDirectSoftwareJobs(10) : [];
    return NextResponse.json<InternshipResponse>({ jobs, track: requestedTrack, live: false });
  }
}
