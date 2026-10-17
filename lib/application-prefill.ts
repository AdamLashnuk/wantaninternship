import type { InternshipJob } from "./internships";

export function getApplicationTrackerUrl(job: InternshipJob) {
  const locations = job.locations?.length ? job.locations : [job.location];
  const params = new URLSearchParams({
    company: job.company,
    role: job.title,
    location: locations.join(", "),
    status: "saved",
    source_job_id: job.id,
    source_url: job.applicationUrl || job.applyUrl || "",
  });

  return `/applications/new?${params.toString()}`;
}
