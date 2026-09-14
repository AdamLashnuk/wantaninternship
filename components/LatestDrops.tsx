"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import { isUsInternship } from "../lib/internship-location";
import type { InternshipJob, InternshipResponse } from "../lib/internships";
import CompanyLogo from "./CompanyLogo";

function fallbackJobs(): InternshipJob[] {
  return trackContent.software.drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    companyWebsite: drop.website,
    title: drop.role,
    location: drop.location,
    locations: [drop.location],
    applyUrl: drop.url,
    source: "curated",
    firstSeenAt: "",
  }));
}

function freshnessLabel(firstSeenAt: string) {
  if (!firstSeenAt) return "Recently added";
  const timestamp = new Date(firstSeenAt).getTime();
  if (!Number.isFinite(timestamp)) return "Recently added";

  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return "Added this hour";
  if (hours < 24) return `Added ${hours}h ago`;
  return `Added ${Math.floor(hours / 24)}d ago`;
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
        const usaJobs = payload.jobs.filter(isUsInternship).slice(0, 3);
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
          <a
            className="latest-drop"
            href={job.applyUrl}
            key={job.id}
            target="_blank"
            rel="noreferrer"
          >
            <span className="latest-drop-brand">
              <CompanyLogo
                company={job.company}
                website={job.companyWebsite}
              />
              <span className="latest-drop-company">{job.company}</span>
            </span>
            <strong>{job.title}</strong>
            <span className="latest-drop-location">{job.location}</span>
            <span className="latest-drop-link" aria-hidden="true">
              {isLive ? freshnessLabel(job.firstSeenAt) : "View roles"} ↗
            </span>
          </a>
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
