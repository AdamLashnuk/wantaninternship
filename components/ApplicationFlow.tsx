"use client";
import { useEffect, useId, useRef, useState } from "react";
import { applicationCounts, flowLayout } from "../lib/application-flow";
import type { SavedApplication } from "../lib/applications";
import styles from "./ApplicationFlow.module.css";

export default function ApplicationFlow({ applications, filter, onFilter }: { applications: SavedApplication[]; filter: string; onFilter: (status: string) => void }) {
  const target = applicationCounts(applications);
  const key = target.join(",");
  const [values, setValues] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const current = useRef(values);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const next = key.split(",").map(Number);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { current.current = next; setValues(next); return; }
    const from = [...current.current];
    let start: number | undefined;
    let frame: number;
    const animate = (time: number) => {
      start ??= time;
      const progress = Math.min((time - start) / 700, 1);
      const eased = 1 - (1 - progress) ** 3;
      const updated = next.map((value, index) => from[index] + (value - from[index]) * eased);
      current.current = updated; setValues(updated);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [key]);
  const layout = flowLayout(values);
  return <section className={styles.panel} aria-labelledby={`${id}-heading`}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>THE BIG PICTURE</span><h2 id={`${id}-heading`}>Your application flow</h2></div><span className={styles.total}>{applications.length} tracked</span></div>
    <p className={styles.description}>Where your opportunities stand. Select a status to see its internships.</p>
    <div className={styles.viewport}>
      <svg className={styles.chart} viewBox="0 0 920 400" role="group" aria-label="Current application statuses. Ribbon widths represent the number of internships in each status.">
        <defs>{layout.branches.map((branch, index) => <linearGradient key={branch.status} id={`${id}-${index}`}><stop stopColor="#60a5fa" stopOpacity=".24" /><stop offset="1" stopColor={`var(--flow-${index})`} stopOpacity=".65" /></linearGradient>)}</defs>
        <text x="182" y="191" textAnchor="end" className={styles.sourceTitle}>Tracked internships</text>
        <text x="182" y="218" textAnchor="end" className={styles.sourceCount}>{applications.length}</text>
        <rect x="206" y={layout.top} width="12" height={Math.max(2, layout.height)} rx="4" className={styles.source} />
        {layout.branches.map((branch, index) => <g key={branch.status} className={`${styles.branch} ${filter !== "All" && filter !== branch.status ? styles.dim : ""}`}>
          <path d={branch.path} fill={`url(#${id}-${index})`} opacity={branch.count > 0 ? 1 : 0} />
          <g className={styles.node} role="button" tabIndex={0} aria-label={`${branch.status}: ${target[index]} internships. Filter by ${branch.status}.`} aria-pressed={filter === branch.status} onClick={() => onFilter(filter === branch.status ? "All" : branch.status)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onFilter(filter === branch.status ? "All" : branch.status); } }}>
            <title>{branch.status}: {target[index]} ({applications.length ? Math.round(target[index] / applications.length * 100) : 0}%)</title>
            <rect x="672" y={branch.y - 23} width="226" height="46" rx="10" className={styles.nodeBackground} />
            <rect x="680" y={branch.y - Math.max(4, branch.thickness) / 2} width="9" height={Math.max(4, branch.thickness)} rx="3" fill={`var(--flow-${index})`} opacity={target[index] ? 1 : .35} />
            <text x="710" y={branch.y + 5} className={styles.nodeLabel}>{branch.status === "Offer" ? "Offers" : branch.status}</text>
            <text x="878" y={branch.y + 5} textAnchor="end" className={styles.nodeCount}>{Math.round(branch.count)}</text>
          </g>
        </g>)}
      </svg>
    </div>
    {!applications.length && <p className={styles.empty}>Save your first internship to start your flow.</p>}
  </section>;
}
