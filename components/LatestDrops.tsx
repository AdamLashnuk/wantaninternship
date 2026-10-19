"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import { formatJobDate } from "../lib/internship-dates";
import { isUsInternship } from "../lib/internship-location";
import { sortInternshipsNewestFirst } from "../lib/internship-sorting";
import type { InternshipJob, InternshipResponse, OpportunityTrack } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";

function fallbackJobs(track: OpportunityTrack): InternshipJob[] {
  return trackContent[track].drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    opportunityType: "internship",
    positionType: "internship",
    softwareCategory: track === "software" ? "swe" : undefined,
    engineeringDiscipline: track === "engineering" ? "other-engineering" : undefined,
    track,
    location: drop.location,
    locations: [drop.location],
    applicationUrl: drop.url,
    applyUrl: drop.url,
    source: "curated",
    firstSeenAt: "",
    active: true,
  }));
}

export default function LatestDrops({ track }: { track: OpportunityTrack }) {
  const curatedJobs = useMemo(
    () => fallbackJobs(track).filter(isUsInternship).slice(0, 3),
    [track],
  );
  const [jobs, setJobs] = useState<InternshipJob[]>(curatedJobs);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setJobs(curatedJobs);
    setIsLive(false);

    async function loadJobs() {
      try {
        const response = await fetch(`/api/internships?track=${track}&limit=100`, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as InternshipResponse;
        const usaJobs = sortInternshipsNewestFirst(payload.jobs.filter(isUsInternship)).slice(0, 3);
        if (payload.live && usaJobs.length > 0) {
          setJobs(usaJobs);
          setIsLive(true);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load latest drops", error);
        }
      }
    }

    loadJobs();
    return () => controller.abort();
  }, [curatedJobs, track]);

  const trackLabel = track === "engineering" ? "Engineering" : "Software";

  return (
    <aside className="latest-drops" aria-labelledby="latest-drops-title">
      <div className="latest-drops-heading">
        <span className="latest-drops-pulse" aria-hidden="true" />
        <div>
          <p>{isLive ? "Automatically refreshed" : "Fresh opportunities"}</p>
          <h2 id="latest-drops-title">Latest {trackLabel} Drops</h2>
        </div>
      </div>

      <div className="latest-drop-list">
        {jobs.map((job) => (
          <a
            className="latest-drop"
            href={job.applicationUrl || job.applyUrl}
            key={job.id}
            target="_blank"
            rel="noreferrer"
          >
            <span className="latest-drop-brand">
              <CompanyLogo
                company={job.company}
                website={job.companyWebsite}
                applicationUrl={job.applicationUrl}
              />
              <span className="latest-drop-company">{job.company}</span>
            </span>
            <strong>{job.title}</strong>
            <span className="latest-drop-location">{job.location}</span>
            <span className="latest-drop-link" aria-hidden="true">
              {isLive ? formatJobDate(job) : "View roles"} ↗
            </span>
          </a>
        ))}
      </div>

      <a className="latest-drops-view-all" href={`/latest-drops?track=${track}`}>
        Browse all {trackLabel.toLowerCase()} roles
        <span aria-hidden="true">→</span>
      </a>

      <p className="latest-drops-note">
        Free {trackLabel.toLowerCase()} listings. Always verify deadlines on the employer site.
      </p>
    </aside>
  );
}
