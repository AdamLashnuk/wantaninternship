import "server-only";
import type { InternshipJob } from "./internships";
import { selectHomePreview } from "./home-preview";
// Public preview only: no cookies, authorization, user data or paid-feed requests.
export async function getHomePreview(): Promise<InternshipJob[]> {
  const endpoint = process.env.INTERNSHIPS_API_URL;
  if (!endpoint) return [];
  const results = await Promise.allSettled((["software", "engineering"] as const).map(async track => {
    const url = new URL(endpoint);
    url.searchParams.set("track", track);
    url.searchParams.set("limit", "10");
    url.searchParams.set("preview", "home");
    const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(1500) });
    if (!response.ok) return [];
    const data = await response.json();
    if (track === "engineering" && data.track !== track) return [];
    if (!Array.isArray(data.jobs)) return [];
    return data.jobs.slice(0, 10).filter((job: InternshipJob) => job &&
      typeof job.id === "string" && typeof job.title === "string" && typeof job.company === "string" &&
      typeof job.location === "string" && typeof job.firstSeenAt === "string" &&
      typeof job.applicationUrl === "string" && /^https?:\/\//i.test(job.applicationUrl),
    ) as InternshipJob[];
  }));
  return selectHomePreview(results.flatMap(result => result.status === "fulfilled" ? result.value : []));
}
