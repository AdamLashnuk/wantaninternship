"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { applicationStatuses, pendingApplicationKey, type SavedApplication } from "../lib/applications";
import styles from "./ApplicationsDashboard.module.css";

async function request(method = "GET", body?: unknown) {
  const response = await fetch("/api/applications", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load your tracker.");
  return result;
}
function ApplicationCard({ application, refresh }: { application: SavedApplication; refresh: () => Promise<void> }) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState("");
  async function update(nextStatus = status) {
    setBusy(true); setError(""); setNotice("");
    try { await request("PATCH", { id: application.id, status: nextStatus, notes }); setStatus(nextStatus); setNotice("Saved"); await refresh(); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <article className={styles.card}>
    <div className={styles.cardTop}><div><span className={styles.company}>{application.company}</span><h2><a href={application.applicationUrl} target="_blank" rel="noreferrer">{application.title}</a></h2><p>{application.location || "Location not specified"}</p></div>
      <label className={styles.statusLabel}><span className={styles.srOnly}>Application status for {application.title} at {application.company}</span><select value={status} disabled={busy} onChange={event => void update(event.target.value as SavedApplication["status"])}>{applicationStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className={styles.cardBottom}><span>Saved {new Date(application.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><div><button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? "Hide notes" : "Notes"}</button><a href={application.applicationUrl} target="_blank" rel="noreferrer">View opening</a><button type="button" className={styles.remove} onClick={() => setRemoving(true)}>Remove</button></div></div>
    {editing && <div className={styles.notes}><label>Notes<textarea maxLength={5000} value={notes} onChange={event => { setNotes(event.target.value); setNotice(""); }} placeholder="Interview dates, follow-ups, or anything to remember…" /></label><button type="button" className={styles.primary} disabled={busy} onClick={() => void update()}>Save notes</button></div>}
    {removing && <div className={styles.confirm}><span>Remove this internship from your tracker?</span><button disabled={busy} type="button" onClick={async () => { setBusy(true); setError(""); try { await request("DELETE", { id: application.id }); await refresh(); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Remove internship</button><button type="button" onClick={() => setRemoving(false)}>Cancel</button></div>}
    {notice && <span className={styles.notice} role="status">{notice}</span>}{error && <p className={styles.error} role="alert">{error}</p>}
  </article>;
}
export default function ApplicationsDashboard() {
  const { user, loading: accountLoading } = useAccount();
  const router = useRouter();
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const refresh = useCallback(async () => { const result = await request(); setApplications(result.applications); }, []);
  useEffect(() => {
    if (accountLoading) return;
    if (!user) { router.replace("/login?next=/applications"); return; }
    if (running.current) return;
    running.current = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const saved = sessionStorage.getItem(pendingApplicationKey);
        if (saved) { setPending(true); await request("POST", JSON.parse(saved)); sessionStorage.removeItem(pendingApplicationKey); setPending(false); }
        await refresh();
      } catch (error) { setError((error as Error).message); }
      finally { setLoading(false); running.current = false; }
    }
    void load();
  }, [user, accountLoading, router, refresh, retry]);
  const filtered = applications.filter(item => (filter === "All" || item.status === filter) && `${item.company} ${item.title} ${item.location}`.toLowerCase().includes(query.toLowerCase()));
  return <section className={styles.dashboard}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>YOUR NEXT CHAPTER</span><h1>Applications</h1><p>Keep your opportunities in one place.</p></div><Link className={styles.primary} href="/latest-drops">Browse internships</Link></div>
    <div className={styles.stats}>{["Saved", "Applied", "Interviewing", "Offer"].map(status => <button key={status} type="button" onClick={() => setFilter(filter === status ? "All" : status)} aria-pressed={filter === status}><span>{status === "Offer" ? "Offers" : status}</span><strong>{applications.filter(item => item.status === status).length}</strong></button>)}</div>
    <div className={styles.toolbar}><label className={styles.srOnly} htmlFor="application-search">Search applications</label><input id="application-search" type="search" placeholder="Search company or role" value={query} onChange={event => setQuery(event.target.value)} /><label className={styles.srOnly} htmlFor="application-filter">Filter by status</label><select id="application-filter" value={filter} onChange={event => setFilter(event.target.value)}>{["All", ...applicationStatuses].map(status => <option key={status}>{status}</option>)}</select></div>
    {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => setRetry(retry + 1)}>Try again</button></div>}
    {loading || accountLoading ? <p className={styles.empty} role="status">Loading your applications…</p> : filtered.length ? <div className={styles.list}>{filtered.map(application => <ApplicationCard key={application.id} application={application} refresh={refresh} />)}</div> : !error && <div className={styles.empty}><svg width="30" height="36" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 3h16v22l-8-5-8 5Z" /></svg><h2>{applications.length ? "No matching applications" : "Your next opportunity starts here"}</h2><p>{applications.length ? "Try another search or status." : "Tap the bookmark on any internship to save it here. Update its status as you go."}</p>{!applications.length && <Link className={styles.primary} href="/latest-drops">Find an internship</Link>}</div>}
    {pending && !loading && <p className={styles.error}>Your internship hasn’t been saved yet. Use Try again above to finish saving it.</p>}
  </section>;
}
