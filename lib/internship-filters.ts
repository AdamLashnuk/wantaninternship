import { isUsInternship } from "./internship-location.ts";
import type { InternshipJob, OpportunityType, SoftwareCategory } from "./internships.ts";

export type OpportunityFilter = OpportunityType | "all";
export type AreaFilter = "usa" | "global" | "remote";
export type CategoryFilter = SoftwareCategory | "all";

export type InternshipFilters = {
  keyword: string;
  opportunity: OpportunityFilter;
  area: AreaFilter;
  category: CategoryFilter;
};

const seniorityPattern = /\b(senior|staff|principal|director|architect|manager|lead|head of|vice president)\b|\bsr\.?(?=\s|,|$)|\bvp\b/i;

export function isRemoteInternship(job: InternshipJob) {
  const locations = job.locations?.length ? job.locations : [job.location];
  return locations.some((location) => /\b(remote|work from home|distributed)\b/i.test(location));
}

export function filterInternships(jobs: InternshipJob[], filters: InternshipFilters) {
  const keyword = filters.keyword.trim().toLowerCase();
  return jobs.filter((job) => {
    if (seniorityPattern.test(job.title)) return false;
    if (filters.opportunity !== "all" && job.opportunityType !== filters.opportunity) return false;
    if (filters.category !== "all" && job.softwareCategory !== filters.category) return false;
    if (filters.area === "usa" && !isUsInternship(job)) return false;
    if (filters.area === "remote" && !isRemoteInternship(job)) return false;
    if (!keyword) return true;
    return [job.company, job.title, ...(job.locations?.length ? job.locations : [job.location])]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export function getRefreshStatus(updatedAt: string | undefined, now = Date.now()) {
  if (!updatedAt) return { label: "Refresh status unavailable", state: "unavailable" as const };
  const updated = new Date(updatedAt).getTime();
  if (!Number.isFinite(updated)) return { label: "Refresh status unavailable", state: "unavailable" as const };

  const delta = updated + 3_600_000 - now;
  if (delta > 0) {
    const totalSeconds = Math.ceil(delta / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      label: `Next refresh in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      state: "countdown" as const,
    };
  }
  if (delta > -300_000) return { label: "Updating soon", state: "soon" as const };
  return { label: "Refresh delayed", state: "delayed" as const };
}

export function formatLastRefresh(updatedAt?: string) {
  if (!updatedAt) return "Last refresh unavailable";
  const date = new Date(updatedAt);
  if (!Number.isFinite(date.getTime())) return "Last refresh unavailable";
  return `Last refreshed ${date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}
