import { createHash } from "node:crypto";
import type { InternshipJob, InternshipSource } from "./internships";

type Source = {
  company: string;
  website: string;
  provider: Exclude<InternshipSource, "curated" | "lever">;
  board: string;
};

const sources: Source[] = [
  { company: "Datadog", website: "https://www.datadoghq.com", provider: "greenhouse", board: "datadog" },
  { company: "Duolingo", website: "https://www.duolingo.com", provider: "greenhouse", board: "duolingo" },
  { company: "Cloudflare", website: "https://www.cloudflare.com", provider: "greenhouse", board: "cloudflare" },
  { company: "Databricks", website: "https://www.databricks.com", provider: "greenhouse", board: "databricks" },
  { company: "Figma", website: "https://www.figma.com", provider: "greenhouse", board: "figma" },
  { company: "Discord", website: "https://discord.com", provider: "greenhouse", board: "discord" },
  { company: "Lyft", website: "https://www.lyft.com", provider: "greenhouse", board: "lyft" },
  { company: "Airbnb", website: "https://www.airbnb.com", provider: "greenhouse", board: "airbnb" },
  { company: "Roblox", website: "https://www.roblox.com", provider: "greenhouse", board: "roblox" },
  { company: "SpaceX", website: "https://www.spacex.com", provider: "greenhouse", board: "spacex" },
  { company: "Robinhood", website: "https://robinhood.com", provider: "greenhouse", board: "robinhood" },
  { company: "Ramp", website: "https://ramp.com", provider: "ashby", board: "ramp" },
];

const internshipPattern = /\b(intern|internship|co-op|co op)\b/i;
const softwarePattern =
  /\b(software|developer|engineering|engineer|data|machine learning|artificial intelligence|ai|cloud|security|cyber|devops|site reliability|sre|product|technology|technical|it)\b/i;

type RawJob = InternshipJob & {
  searchable: string;
};

function idFor(source: InternshipSource, sourceId: string) {
  return createHash("sha256").update(`${source}:${sourceId}`).digest("hex");
}

function listingKey(job: Pick<InternshipJob, "company" | "title">) {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${normalize(job.company)}:${normalize(job.title)}`;
}

function mergeDuplicateLocations(jobs: RawJob[]) {
  const grouped = new Map<
    string,
    { job: RawJob; locations: Set<string> }
  >();

  for (const job of jobs) {
    const key = listingKey(job);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        job,
        locations: new Set(job.locations ?? [job.location]),
      });
      continue;
    }

    for (const location of job.locations ?? [job.location]) {
      existing.locations.add(location);
    }
  }

  return [...grouped.values()].map(({ job, locations }) => {
    const allLocations = [...locations];
    return {
      ...job,
      location: allLocations.length > 1 ? "Multiple locations" : job.location,
      locations: allLocations,
    };
  });
}

async function getJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WantAnInternship/1.0 (wantaninternship@gmail.com)",
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

async function greenhouseJobs(source: Source): Promise<RawJob[]> {
  const payload = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${source.board}/jobs?content=true`,
  );
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];

  return jobs.map((value) => {
    const job = value as Record<string, unknown>;
    const location = job.location as { name?: string } | undefined;
    const departments = Array.isArray(job.departments)
      ? job.departments
          .map((department) => (department as { name?: string }).name ?? "")
          .join(" ")
      : "";
    const title = typeof job.title === "string" ? job.title : "Untitled internship";
    const url = typeof job.absolute_url === "string" ? job.absolute_url : "";
    const updatedAt =
      typeof job.updated_at === "string" ? job.updated_at : new Date(0).toISOString();

    return {
      id: idFor("greenhouse", String(job.id ?? url)),
      company: source.company,
      companyWebsite: source.website,
      title,
      location: location?.name ?? "Location not listed",
      locations: [location?.name ?? "Location not listed"],
      applyUrl: url,
      source: "greenhouse",
      firstSeenAt: updatedAt,
      postedAt: updatedAt,
      searchable: `${title} ${departments} ${typeof job.content === "string" ? job.content : ""}`,
    };
  });
}

async function ashbyJobs(source: Source): Promise<RawJob[]> {
  const payload = await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${source.board}`,
  );
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];

  return jobs.map((value) => {
    const job = value as Record<string, unknown>;
    const title = typeof job.title === "string" ? job.title : "Untitled internship";
    const jobUrl = typeof job.jobUrl === "string" ? job.jobUrl : "";
    const applyUrl = typeof job.applyUrl === "string" ? job.applyUrl : jobUrl;
    const publishedAt =
      typeof job.publishedAt === "string"
        ? job.publishedAt
        : new Date(0).toISOString();

    return {
      id: idFor("ashby", jobUrl || applyUrl),
      company: source.company,
      companyWebsite: source.website,
      title,
      location: typeof job.location === "string" ? job.location : "Location not listed",
      locations: [
        typeof job.location === "string" ? job.location : "Location not listed",
      ],
      applyUrl,
      source: "ashby",
      firstSeenAt: publishedAt,
      postedAt: publishedAt,
      searchable: [title, job.department, job.team, job.descriptionPlain]
        .filter((part): part is string => typeof part === "string")
        .join(" "),
    };
  });
}

async function loadSource(source: Source) {
  return source.provider === "greenhouse"
    ? greenhouseJobs(source)
    : ashbyJobs(source);
}

export async function getDirectSoftwareJobs(limit: number): Promise<InternshipJob[]> {
  const results = await Promise.allSettled(sources.map(loadSource));
  const jobs = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const matchingJobs = jobs
    .filter(
      (job) =>
        Boolean(job.applyUrl) &&
        internshipPattern.test(job.title) &&
        softwarePattern.test(job.searchable),
    )
    .sort(
      (left, right) =>
        new Date(right.firstSeenAt).getTime() - new Date(left.firstSeenAt).getTime(),
    );

  return mergeDuplicateLocations(matchingJobs)
    .slice(0, limit)
    .map(({ searchable: _searchable, ...job }) => job);
}
