"use client";

import Link from "next/link";
import { useId, useEffect, useRef, useState } from "react";
import { useAccount } from "./AccountProvider";
import styles from "./AccountMenu.module.css";

export default function AccountMenu() {
  const { user, loading, logout } = useAccount();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); };
  }, [open]);

  const links = user ? [{ label: "Profile", href: "/profile", icon: "profile" }, { label: "Subscription", href: "/subscription", icon: "card" }, { label: "Help", href: "/help", icon: "help" }] : [{ label: "Log in", href: "/login", icon: "profile" }, { label: "Help", href: "/help", icon: "help" }];
  const initial = (user?.name || user?.email || "").charAt(0).toUpperCase();

  return (
    <div className={styles.root} ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
      <button ref={trigger} className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`} type="button" aria-label={user ? "Open account menu" : "Create an account or log in"} aria-expanded={open} aria-controls={id} disabled={loading}
        onClick={() => { setOpen(!open); setError(""); }}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>("nav a")?.focus()); } }}>
        <span className={styles.avatar}>{initial || <AccountIcon name="profile" />}</span>
        <span className={styles.triggerLabel}>{user ? "My account" : "Account"}</span>
        <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ""}`} inert={!open} aria-hidden={!open} id={id}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{user ? "Your space" : "Welcome in"}</span>
          <strong>{user?.name || "Your next opportunity awaits."}</strong>
          {user && <span className={styles.email}>{user.email}</span>}
        </div>
        <nav aria-label="Account navigation" className={styles.links}>
          {links.map((link) => <Link key={link.href} href={link.href} onClick={close} className={styles.item}><AccountIcon name={link.icon} /><span>{link.label}</span><span className={styles.arrow} aria-hidden="true">↗</span></Link>)}
          {user && <button className={`${styles.item} ${styles.logout}`} type="button" disabled={leaving} onClick={async () => { setLeaving(true); try { await logout(); } catch (error) { setError((error as Error).message); setLeaving(false); } }}><AccountIcon name="logout" /><span>{leaving ? "Logging out…" : "Log out"}</span></button>}
        </nav>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

function AccountIcon({ name }: { name: string }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "profile" ? <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></> : name === "card" ? <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h3" /></> : name === "logout" ? <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 8l4 4-4 4M8 12h10" /></> : <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" /></>}
  </svg>;
}
