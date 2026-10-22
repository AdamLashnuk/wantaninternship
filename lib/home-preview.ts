import type { InternshipJob } from "./internships";
import { originalPostingDate } from "./internship-dates.ts";
import { sortInternshipsNewestFirst } from "./internship-sorting.ts";
export function selectHomePreview(jobs: InternshipJob[], now = Date.now()) {
  const cutoff = now - 14 * 24 * 60 * 60 * 1000;
  const active = jobs.filter(job => job.active && job.opportunityType === "internship" && Date.parse(originalPostingDate(job) || job.firstSeenAt) >= cutoff);
  return sortInternshipsNewestFirst([...new Map(active.map(job => [job.applicationUrl, job])).values()]).slice(0, 10);
}
