"use client";

import { useEffect, useMemo, useState } from "react";
import { trackContent } from "../data/tracks";
import type { InternshipJob, InternshipResponse } from "../lib/internships";

function getFallbackJobs(): InternshipJob[] {
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

function relativeTime(value: string) {
  if (!value) return "Recently added";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently added";

  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return "Added within the last hour";
  if (hours < 24) return `Added about ${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `Added about ${days} day${days === 1 ? "" : "s"} ago`;
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M3 12.5h18M9.5 12.5v2h5v-2" />
    </svg>
  );
}

export default function LatestDropsDirectory() {
  const fallback = useMemo(getFallbackJobs, []);
  const [jobs, setJobs] = useState<InternshipJob[]>(fallback);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
        if (payload.live && payload.jobs.length > 0) {
          setJobs(payload.jobs);
          setIsLive(true);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load internships", error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
    return () => controller.abort();
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return jobs;

    return jobs.filter((job) =>
      [job.company, job.title, job.location]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [jobs, query]);

  return (
    <section className="drops-directory" aria-labelledby="drops-directory-title">
      <div className="drops-page-intro">
        <span className="track-eyebrow">Software opportunities</span>
        <h1 id="drops-directory-title">Latest Internship Drops</h1>
        <p>
          Recently discovered software, engineering, data and technical
          internships—free to browse and linked directly to the employer.
        </p>
      </div>

      <div className="drops-toolbar">
        <label className="drops-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, role or location..."
          />
        </label>
        <span className="drops-count">
          {loading
            ? "Checking for new internships…"
            : `Showing ${filteredJobs.length} software internship${filteredJobs.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {!isLive && !loading && (
        <div className="drops-setup-note">
          Live syncing is ready to connect. Showing curated roles until the AWS
          internship API is deployed.
        </div>
      )}

      <div className="drops-results">
        {filteredJobs.map((job) => (
          <article className="drops-result-card" key={job.id}>
            <div className="drops-result-icon">
              <BriefcaseIcon />
            </div>

            <div className="drops-result-content">
              <span>{job.company}</span>
              <h2>{job.title}</h2>
              <div className="drops-result-meta">
                <span>{job.location}</span>
                <span>{relativeTime(job.firstSeenAt)}</span>
              </div>
            </div>

            <a
              className="drops-apply-button"
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Apply <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}

        {filteredJobs.length === 0 && (
          <div className="empty-state drops-empty-state">
            No software internships matched your search.
          </div>
        )}
      </div>
    </section>
  );
}
