const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

function validTimestamp(value) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function effectivePostingTimestamp(postedAt, firstSeenAt, now = new Date().toISOString()) {
  const currentTimestamp = validTimestamp(now) ?? Date.now();
  const postedTimestamp = validTimestamp(postedAt);

  if (
    postedTimestamp !== undefined
    && postedTimestamp <= currentTimestamp + MAX_FUTURE_SKEW_MS
  ) {
    return new Date(postedTimestamp).toISOString();
  }

  const firstSeenTimestamp = validTimestamp(firstSeenAt);
  if (firstSeenTimestamp !== undefined) {
    return new Date(firstSeenTimestamp).toISOString();
  }

  return new Date(currentTimestamp).toISOString();
}

export function discoverySortKey(job, firstSeenAt, now) {
  return `${effectivePostingTimestamp(job.postedAt, firstSeenAt, now)}#${job.id}`;
}

export function isWithinPostingWindow(postedAt, firstSeenAt, now, days) {
  const currentTimestamp = validTimestamp(now) ?? Date.now();
  const effectiveTimestamp = Date.parse(
    effectivePostingTimestamp(postedAt, firstSeenAt, new Date(currentTimestamp).toISOString()),
  );
  const cutoff = currentTimestamp - days * 24 * 60 * 60 * 1000;
  return effectiveTimestamp >= cutoff;
}
