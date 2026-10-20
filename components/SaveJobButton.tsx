"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { pendingApplicationKey } from "../lib/applications";
import type { InternshipJob } from "../lib/internships";
import styles from "./SaveJobButton.module.css";

export default function SaveJobButton({ job }: { job: InternshipJob }) {
  const { user, loading } = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true); setError("");
    const record = { company: job.company, title: job.title, location: job.location, applicationUrl: job.applicationUrl || job.applyUrl };
    try {
      if (!user) {
        sessionStorage.setItem(pendingApplicationKey, JSON.stringify(record));
        router.push("/login?next=/applications"); return;
      }
      const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(record) });
      const result = await response.json();
      if (response.status === 401) { sessionStorage.setItem(pendingApplicationKey, JSON.stringify(record)); router.push("/login?next=/applications"); return; }
      if (!response.ok) throw new Error(result.error || "Unable to save this internship.");
      router.push("/applications");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <span className={styles.wrapper}>
    <button className={styles.button} type="button" disabled={busy || loading} onClick={save} aria-label={`Save ${job.title} at ${job.company} and open dashboard`} title="Save to your dashboard">
      <svg width="20" height="23" viewBox="0 0 24 28" fill="currentColor" aria-hidden="true"><path d="M5 3h14a1 1 0 0 1 1 1v21l-8-5-8 5V4a1 1 0 0 1 1-1Z" /></svg>
    </button>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </span>;
}
