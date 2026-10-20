"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { pendingApplicationKey, type SavedApplication } from "../lib/applications";
import styles from "./ApplicationsDashboard.module.css";
import { useBilling } from "./BillingProvider";
import PremiumPrompt from "./PremiumPrompt";
import ApplicationFlow from "./ApplicationFlow";
import ApplicationStatusMenu from "./ApplicationStatusMenu";

async function request(method = "GET", body?: unknown) {
  const response = await fetch("/api/applications", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load your tracker.");
  return result;
}
function ApplicationCard({ application, onUpdate, onRemove }: { application: SavedApplication; onUpdate: (id: string, update: Partial<SavedApplication>) => void; onRemove: (id: string) => void }) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState("");
  async function update(nextStatus = status) {
    setBusy(true); setError(""); setNotice("");
    try { await request("PATCH", { id: application.id, status: nextStatus, notes }); setStatus(nextStatus); setNotice("Saved"); onUpdate(application.id, { status: nextStatus, notes }); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <article className={styles.card}>
    <div className={styles.cardTop}><div><span className={styles.company}>{application.company}</span><h2><a href={application.applicationUrl} target="_blank" rel="noreferrer">{application.title}</a></h2><p>{application.location || "Location not specified"}</p></div>
      <ApplicationStatusMenu value={status} disabled={busy} label={`Application status for ${application.title} at ${application.company}`} onChange={value => void update(value as SavedApplication["status"])} />
    </div>
    <div className={styles.cardBottom}><span>Saved {new Date(application.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><div><button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? "Hide notes" : "Notes"}</button><a href={application.applicationUrl} target="_blank" rel="noreferrer">View opening</a><button type="button" className={styles.remove} onClick={() => setRemoving(true)}>Remove</button></div></div>
    {editing && <div className={styles.notes}><label>Notes<textarea maxLength={5000} value={notes} onChange={event => { setNotes(event.target.value); setNotice(""); }} placeholder="Interview dates, follow-ups, or anything to remember…" /></label><button type="button" className={styles.primary} disabled={busy} onClick={() => void update()}>Save notes</button></div>}
    {removing && <div className={styles.confirm}><span>Remove this internship from your tracker?</span><button disabled={busy} type="button" onClick={async () => { setBusy(true); setError(""); try { await request("DELETE", { id: application.id }); onRemove(application.id); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Remove internship</button><button type="button" onClick={() => setRemoving(false)}>Cancel</button></div>}
    {notice && <span className={styles.notice} role="status">{notice}</span>}{error && <p className={styles.error} role="alert">{error}</p>}
  </article>;
}
export default function ApplicationsDashboard() {
  const { user, loading: accountLoading } = useAccount();
  const router = useRouter();
  const { billing, loading: billingLoading } = useBilling();
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
        if (saved) {
          setPending(true);
          try { await request("POST", JSON.parse(saved)); sessionStorage.removeItem(pendingApplicationKey); setPending(false); }
          catch (error) { setError((error as Error).message); }
        }
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
    {billing.premium ? <ApplicationFlow applications={applications} filter={filter} onFilter={setFilter} /> : !billingLoading && <PremiumPrompt graph={applications.length < 10} tracker={applications.length >= 10} />}
    <div className={styles.toolbar}><label className={styles.srOnly} htmlFor="application-search">Search applications</label><input id="application-search" type="search" placeholder="Search company or role" value={query} onChange={event => setQuery(event.target.value)} /><ApplicationStatusMenu value={filter} onChange={setFilter} label="Filter applications by status" all /></div>
    {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => setRetry(retry + 1)}>Try again</button></div>}
    {loading || accountLoading ? <p className={styles.empty} role="status">Loading your applications…</p> : filtered.length ? <div className={styles.list}>{filtered.map(application => <ApplicationCard key={application.id} application={application} onUpdate={(id, update) => setApplications(previous => previous.map(item => item.id === id ? { ...item, ...update } : item))} onRemove={id => setApplications(previous => previous.filter(item => item.id !== id))} />)}</div> : !error && <div className={styles.empty}><svg width="30" height="36" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 3h16v22l-8-5-8 5Z" /></svg><h2>{applications.length ? "No matching applications" : "Your next opportunity starts here"}</h2><p>{applications.length ? "Try another search or status." : "Tap the bookmark on any internship to save it here. Update its status as you go."}</p>{!applications.length && <Link className={styles.primary} href="/latest-drops">Find an internship</Link>}</div>}
    {pending && !loading && <p className={styles.error}>Your internship hasn’t been saved yet. Use Try again above to finish saving it.</p>}
  </section>;
}
