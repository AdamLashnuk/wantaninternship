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

  const links = user ? [{ label: "Profile", href: "/profile" }, { label: "Subscription", href: "/subscription" }, { label: "Help", href: "/help" }] : [{ label: "Log in", href: "/login" }, { label: "Help", href: "/help" }];
  const initial = (user?.name || user?.email || "").charAt(0).toUpperCase();

  return (
    <div className={styles.root} ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }}>
      <button ref={trigger} className={`${styles.trigger} ${user ? styles.signedIn : ""} ${open ? styles.triggerOpen : ""}`} type="button" aria-label={user ? "Open account menu" : "Create an account or log in"} aria-expanded={open} aria-controls={id} disabled={loading}
        onClick={() => { setOpen(!open); setError(""); }}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>("nav a")?.focus()); } }}>
        {user ? <span className={styles.avatar}>{initial}</span> : <span className={styles.triggerLabel}>Sign in</span>}
      </button>
      <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ""}`} inert={!open} aria-hidden={!open} id={id}>
        {user && <div className={styles.heading}>
          <strong>{user.name || user.email}</strong>
          {user.name && <span className={styles.email}>{user.email}</span>}
        </div>}
        <nav aria-label="Account navigation" className={styles.links}>
          {links.map((link) => <Link key={link.href} href={link.href} onClick={close} className={styles.item}><span>{link.label}</span></Link>)}
          {user && <button className={`${styles.item} ${styles.logout}`} type="button" disabled={leaving} onClick={async () => { setLeaving(true); try { await logout(); } catch (error) { setError((error as Error).message); setLeaving(false); } }}><span>{leaving ? "Logging out…" : "Log out"}</span></button>}
        </nav>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

