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
