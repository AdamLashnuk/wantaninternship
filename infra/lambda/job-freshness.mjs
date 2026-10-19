// An employer edit must never reset a listing's original discovery/posting date.
export function preserveJobFreshness(job, prior, now) {
  const firstSeenAt = prior?.firstSeenAt || now;
  const legacyGreenhouse = prior?.source === "greenhouse" && prior?.freshnessVersion !== 1;
  const previousPost = legacyGreenhouse ? undefined : prior?.postedAt;
  const dates = [previousPost, job.postedAt].filter((value) => Number.isFinite(Date.parse(value ?? "")));
  const postedAt = dates.length ? dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0] : undefined;
  return {
    ...job,
    firstSeenAt,
    postedAt,
    sourceUpdatedAt: job.sourceUpdatedAt ?? prior?.sourceUpdatedAt ?? (legacyGreenhouse ? prior.postedAt : undefined),
    freshnessVersion: 1,
  };
}
