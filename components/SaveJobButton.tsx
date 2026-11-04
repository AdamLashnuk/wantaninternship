"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { pendingApplicationKey, type SavedApplication } from "../lib/applications";
import type { InternshipJob } from "../lib/internships";
import styles from "./SaveJobButton.module.css";

type Bookmark = { id: string; applicationUrl: string };
type SavedState = { bookmarks: Map<string, string>; loading: boolean; update: (bookmark: Bookmark, remove?: boolean) => void };
const SavedJobsContext = createContext<SavedState | null>(null);
function key(url: string) { try { const parsed = new URL(url); parsed.hash = ""; return parsed.toString(); } catch { return url; } }
export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAccount();
  const [bookmarks, setBookmarks] = useState(new Map<string, string>());
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  useEffect(() => {
    const controller = new AbortController();
    setBookmarks(new Map()); setOwner(null); setError("");
    if (!user?.id) { setLoading(false); return; }
    const userId = user.id;
    setLoading(true);
    async function load() {
      try {
        const pending = sessionStorage.getItem(pendingApplicationKey);
        if (pending) {
          const saved = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: pending, signal: controller.signal });
          if (!saved.ok) throw new Error("Your internship couldn’t be saved. Please try again.");
          sessionStorage.removeItem(pendingApplicationKey);
        }
        const response = await fetch("/api/applications", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Couldn’t load your saved internships. Please try again.");
        const result = await response.json() as { applications: SavedApplication[] };
        if (!controller.signal.aborted && currentUser.current === userId) {
          setBookmarks(new Map(result.applications.map(item => [key(item.applicationUrl), item.id]))); setOwner(userId);
        }
      } catch (error) { if (!controller.signal.aborted) setError((error as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [user?.id, retry]);
  function update(bookmark: Bookmark, remove = false) {
    setOwner(user?.id || null);
    setBookmarks(previous => { const next = new Map(previous); if (remove) next.delete(key(bookmark.applicationUrl)); else next.set(key(bookmark.applicationUrl), bookmark.id); return next; });
  }
  return <SavedJobsContext.Provider value={{ bookmarks: owner === user?.id ? bookmarks : new Map(), loading, update }}>
    {error && <p className={styles.loadError} role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></p>}
    {children}
  </SavedJobsContext.Provider>;
}

export default function SaveJobButton({ job }: { job: InternshipJob }) {
  const { user, loading } = useAccount();
  const savedJobs = useContext(SavedJobsContext);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [animated, setAnimated] = useState(false);
  const url = job.applicationUrl || job.applyUrl || "";
  const savedId = savedJobs?.bookmarks.get(key(url));
  async function save() {
    if (busy) return;
    setBusy(true); setError(""); setAnimated(false);
    const record = { company: job.company, title: job.title, location: job.location, applicationUrl: url };
    function login() {
      if (!savedId) sessionStorage.setItem(pendingApplicationKey, JSON.stringify(record));
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    try {
      if (!user) { login(); return; }
      const response = await fetch("/api/applications", { method: savedId ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(savedId ? { id: savedId } : record) });
      const result = await response.json();
      if (response.status === 401) { login(); return; }
      if (!response.ok) throw new Error(result.error || "Unable to update this bookmark.");
      savedJobs?.update({ id: savedId || result.id, applicationUrl: url }, Boolean(savedId));
      setAnimated(true);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <span className={styles.wrapper}>
    <button className={`${styles.button} ${savedId ? styles.saved : ""} ${animated ? styles.animate : ""}`} type="button" disabled={busy || loading || savedJobs?.loading} onClick={save} onAnimationEnd={() => setAnimated(false)} aria-pressed={Boolean(savedId)} aria-busy={busy} aria-label={`${savedId ? "Unsave" : "Save"} ${job.title} at ${job.company}`} title={savedId ? "Remove from saved internships" : "Save internship"}>
      <svg width="20" height="24" viewBox="0 0 24 28" aria-hidden="true"><path d="M5 3h14a1 1 0 0 1 1 1v21l-8-5-8 5V4a1 1 0 0 1 1-1Z" /></svg>
    </button>
    {error && <span className={styles.error} role="alert">{error}</span>}
  </span>;
}
