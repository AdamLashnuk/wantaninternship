export function formatOfficialPostDate(postedAt?: string) {
  if (!postedAt) return "Posting date unavailable";
  const date = new Date(postedAt);
  if (!Number.isFinite(date.getTime())) return "Posting date unavailable";
  return `Posted ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)}`;
}

// Old collector records used Greenhouse's edit timestamp as a posting date.
export function originalPostingDate(job: { source: string; postedAt?: string; freshnessVersion?: number }) {
  return job.source === "greenhouse" && job.freshnessVersion !== 1 ? undefined : job.postedAt;
}

export function formatDiscoveryDate(firstSeenAt?: string) {
  if (!firstSeenAt || !Number.isFinite(Date.parse(firstSeenAt))) return "Discovery date unavailable";
  return `First discovered ${new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(firstSeenAt))}`;
}

export function formatJobDate(job: { source: string; postedAt?: string; firstSeenAt?: string; freshnessVersion?: number }) {
  const postedAt = originalPostingDate(job);
  return postedAt && Number.isFinite(Date.parse(postedAt))
    ? formatOfficialPostDate(postedAt)
    : formatDiscoveryDate(job.firstSeenAt);
}

export function formatJobUpdate(job: { source: string; postedAt?: string; sourceUpdatedAt?: string; firstSeenAt?: string; freshnessVersion?: number }) {
  const updatedAt = job.sourceUpdatedAt ?? (job.source === "greenhouse" && job.freshnessVersion !== 1 ? job.postedAt : undefined);
  const timestamp = Date.parse(updatedAt ?? "");
  const original = Date.parse(originalPostingDate(job) ?? job.firstSeenAt ?? "");
  if (!Number.isFinite(timestamp) || !Number.isFinite(original) || timestamp <= original) return null;
  return `Updated ${new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(timestamp))}`;
}
