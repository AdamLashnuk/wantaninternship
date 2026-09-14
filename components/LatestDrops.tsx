"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import type { InternshipJob, InternshipResponse } from "../lib/internships";

function fallbackJobs(): InternshipJob[] {
  return trackContent.software.drops.map((drop, index) => ({
    id: `curated-${index}`,
    company: drop.company,
    title: drop.role,
    location: drop.location,
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
  const curatedJobs = useMemo(fallbackJobs, []);
  const [jobs, setJobs] = useState<InternshipJob[]>(curatedJobs);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      try {
        const response = await fetch("/api/internships?track=software&limit=3", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload = (await response.json()) as InternshipResponse;
        if (payload.live && payload.jobs.length > 0) {
          setJobs(payload.jobs);
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
            <span className="latest-drop-company">{job.company}</span>
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
