"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import { getApplicationTrackerUrl } from "../lib/application-prefill";
import { formatOfficialPostDate } from "../lib/internship-dates";
import { isUsInternship } from "../lib/internship-location";
import { sortInternshipsNewestFirst } from "../lib/internship-sorting";
import type { InternshipJob, InternshipResponse } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";

function fallbackJobs(): InternshipJob[] {
  return trackContent.software.drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    opportunityType: "internship",
    softwareCategory: "swe",
    location: drop.location,
    locations: [drop.location],
    applicationUrl: drop.url,
    applyUrl: drop.url,
    source: "curated",
    firstSeenAt: "",
    active: true,
  }));
}

export default function LatestDrops() {
  const curatedJobs = useMemo(
    () => fallbackJobs().filter(isUsInternship).slice(0, 3),
    [],
  );
  const [jobs, setJobs] = useState<InternshipJob[]>(curatedJobs);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      try {
        const response = await fetch("/api/internships?track=software&limit=100", {
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
  }, []);

  return (
    <aside className="latest-drops" aria-labelledby="latest-drops-title">
      <div className="latest-drops-heading">
        <span className="latest-drops-pulse" aria-hidden="true" />
        <div>
          <p>{isLive ? "Automatically refreshed" : "Fresh opportunities"}</p>
          <h2 id="latest-drops-title">Latest Software Drops</h2>
        </div>
      </div>

      <div className="latest-drop-list">
        {jobs.map((job) => (
          <article
            className="latest-drop"
            key={job.id}
          >
            <span className="latest-drop-brand">
              <CompanyLogo
                company={job.company}
                website={job.companyWebsite}
                applicationUrl={job.applicationUrl}
              />
              <span className="latest-drop-company">{job.company}</span>
            </span>
            <a
              className="latest-drop-title"
              href={job.applicationUrl || job.applyUrl}
              target="_blank"
              rel="noreferrer"
            >
              <strong>{job.title}</strong>
            </a>
            <span className="latest-drop-location">{job.location}</span>
            <div className="latest-drop-actions">
              <a
                className="latest-drop-link"
                href={job.applicationUrl || job.applyUrl}
                target="_blank"
                rel="noreferrer"
              >
                {isLive ? formatOfficialPostDate(job.postedAt) : "View role"} ↗
              </a>
              <a
                className="latest-drop-track"
                href={getApplicationTrackerUrl(job)}
              >
                Track
              </a>
            </div>
          </article>
        ))}
      </div>

      <a className="latest-drops-view-all" href="/latest-drops">
        Browse all software internships
        <span aria-hidden="true">→</span>
      </a>

      <p className="latest-drops-note">
        Free software listings. Always verify deadlines on the employer site.
      </p>
    </aside>
  );
}
