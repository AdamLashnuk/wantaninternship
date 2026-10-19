"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sortInternshipsNewestFirst } from "../lib/internship-sorting";
import { formatJobDate, originalPostingDate } from "../lib/internship-dates";
import type { InternshipJob, InternshipResponse, OpportunityTrack } from "../lib/internships";
import styles from "../app/mockups/opportunity-radar/page.module.css";

async function loadTrack(track: OpportunityTrack, signal: AbortSignal) {
  const jobs = new Map<string, InternshipJob>();
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ track, limit: "250" });
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(`/api/internships?${query}`, { signal });
    if (!response.ok) throw new Error("Unable to load internship feed");
    const payload = await response.json() as InternshipResponse;
    for (const job of payload.jobs) jobs.set(job.id, job);
    cursor = payload.nextCursor;
    if (cursor && seenCursors.has(cursor)) break;
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return [...jobs.values()];
}

function sourceName(source: string) {
  if (source.startsWith("github:")) return `${source.slice(7)} GitHub`;
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export default function HomeLatestDrops() {
  const [jobs, setJobs] = useState<InternshipJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    async function refresh() {
      if (refreshing) return;
      refreshing = true;
      try {
        const results = await Promise.allSettled([
          loadTrack("software", controller.signal),
          loadTrack("engineering", controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const successful = results.filter((result) => result.status === "fulfilled");
        if (successful.length === 0) {
          setFailed(true);
          return;
        }
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const active = successful.flatMap((result) => result.value).filter((job) =>
          job.active && job.opportunityType === "internship" &&
          Date.parse(originalPostingDate(job) || job.firstSeenAt) >= cutoff,
        );
        const unique = new Map(active.map((job) => [job.applicationUrl, job]));
        setJobs(sortInternshipsNewestFirst([...unique.values()]).slice(0, 6));
        setFailed(false);
      } finally {
        refreshing = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  return (
    <section className={styles.drops} id="latest" aria-labelledby="home-drops-title">
      <div className={styles.sectionHead}>
        <div><i aria-hidden="true" /><h2 id="home-drops-title">Latest internship drops</h2><span>Newest software and engineering postings</span></div>
        <Link href="/latest-drops">View all latest drops <b aria-hidden="true">→</b></Link>
      </div>
      {jobs.length > 0 ? (
        <div className={styles.table}>
          <div className={styles.tableHead}><span>Posted / discovered</span><span>Role</span><span>Company</span><span>Location</span><span>Type</span><span>Source</span></div>
          {jobs.map((job) => (
            <a className={styles.dropRow} href={job.applicationUrl} key={job.id} target="_blank" rel="noreferrer">
              <time title={formatJobDate(job)}>{formatJobDate(job)}</time>
              <strong>{job.title}</strong><span>{job.company}</span><span>{job.location}</span>
              <span className={styles.type}>{job.positionType === "co-op" ? "Co-op" : "Internship"}</span>
              <span className={styles.source}>{sourceName(job.source)}<b aria-hidden="true">↗</b></span>
            </a>
          ))}
        </div>
      ) : (
        <p className={styles.feedStatus} role="status">{loading ? "Loading the latest internships…" : failed
          ? "Unable to load the latest internships right now. Please try again shortly."
          : "No recent internships are available right now. Check back soon."}</p>
      )}
      {failed && jobs.length > 0 && <p className={styles.feedStatus} role="status">Refresh unavailable. Showing previously loaded internships.</p>}
    </section>
  );
}
