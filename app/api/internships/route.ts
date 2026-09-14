import { NextRequest, NextResponse } from "next/server";
import type { InternshipJob, InternshipResponse, OpportunityType, SoftwareCategory } from "../../../lib/internships";
import { getDirectSoftwareJobs } from "../../../lib/direct-software-feed";

export const revalidate = 60;

function normalizeJob(value: unknown): InternshipJob | null {
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

  return {
    ...job,
    id: job.id,
    company: job.company,
    companyWebsite: typeof job.companyWebsite === "string" ? job.companyWebsite : undefined,
    title: job.title,
    opportunityType,
    softwareCategory,
    location: job.location,
    locations: Array.isArray(job.locations) ? job.locations.filter((item): item is string => typeof item === "string") : [job.location],
    applicationUrl,
    applyUrl: applicationUrl,
    source: job.source,
    sources: Array.isArray(job.sources) ? job.sources.filter((item): item is string => typeof item === "string") : undefined,
    sourceUrl: typeof job.sourceUrl === "string" ? job.sourceUrl : undefined,
    firstSeenAt: job.firstSeenAt,
    postedAt: typeof job.postedAt === "string" ? job.postedAt : undefined,
    active: job.active !== false,
  };
}

export async function GET(request: NextRequest) {
  const requestedTrack = request.nextUrl.searchParams.get("track") ?? "software";
  if (requestedTrack !== "software") {
    return NextResponse.json({ error: "Live opportunity drops are available for Software only." }, { status: 400 });
  }

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100) : 50;
  const cursor = request.nextUrl.searchParams.get("cursor");
  const apiUrl = process.env.INTERNSHIPS_API_URL;

  if (!apiUrl) {
    const jobs = await getDirectSoftwareJobs(limit);
    return NextResponse.json<InternshipResponse>({ jobs, live: false });
  }

  try {
    const upstreamUrl = new URL(apiUrl);
    upstreamUrl.searchParams.set("limit", String(limit));
    if (cursor) upstreamUrl.searchParams.set("cursor", cursor);

    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`Internship API returned ${response.status}`);

    const payload = (await response.json()) as Record<string, unknown>;
    const jobs = Array.isArray(payload.jobs)
      ? payload.jobs.map(normalizeJob).filter((job): job is InternshipJob => job !== null)
      : [];

    const sourceCounts = payload.sourceCounts && typeof payload.sourceCounts === "object"
      ? payload.sourceCounts as Record<string, number>
      : undefined;
    const countedJobs = sourceCounts
      ? Object.values(sourceCounts).reduce((sum, count) => sum + Number(count ?? 0), 0)
      : undefined;

    return NextResponse.json<InternshipResponse>({
      jobs,
      live: true,
      updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : undefined,
      nextRefreshAt: typeof payload.nextRefreshAt === "string" ? payload.nextRefreshAt : undefined,
      nextCursor: typeof payload.nextCursor === "string" ? payload.nextCursor : undefined,
      sourceCounts,
      totalJobs: typeof payload.totalJobs === "number" ? payload.totalJobs : countedJobs,
      partial: payload.partial === true,
    });
  } catch (error) {
    console.error("Unable to load live internships", error);
    const jobs = await getDirectSoftwareJobs(limit);
    return NextResponse.json<InternshipResponse>({ jobs, live: false });
  }
}
