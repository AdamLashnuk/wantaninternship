import { originalPostingDate } from "./internship-dates.ts";
import type { InternshipJob } from "./internships.ts";

function timestamp(value?: string) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortInternshipsNewestFirst(jobs: InternshipJob[]) {
  return [...jobs].sort((left, right) => {
    const postedDifference = timestamp(originalPostingDate(right) || right.firstSeenAt) - timestamp(originalPostingDate(left) || left.firstSeenAt);
    if (postedDifference !== 0) return postedDifference;

    const discoveredDifference = timestamp(right.firstSeenAt) - timestamp(left.firstSeenAt);
    if (discoveredDifference !== 0) return discoveredDifference;

    const companyDifference = left.company.localeCompare(right.company);
    if (companyDifference !== 0) return companyDifference;
    return left.title.localeCompare(right.title);
  });
}
