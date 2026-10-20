"use client";
import { useEffect, useId, useRef, useState } from "react";
import { applicationStatuses } from "../lib/applications";
import styles from "./ApplicationStatusMenu.module.css";
const colors: Record<string, string> = { All: "#94a3b8", Saved: "#60a5fa", Applied: "#a78bfa", Interviewing: "#fbbf24", Offer: "#34d399", Rejected: "#fb7185", Withdrawn: "#94a3b8" };
export default function ApplicationStatusMenu({ value, onChange, disabled = false, label, all = false }: { value: string; onChange: (value: string) => void; disabled?: boolean; label: string; all?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = all ? ["All", ...applicationStatuses] : [...applicationStatuses];
  const id = useId();
  function focusOption(index: number) { root.current?.querySelectorAll<HTMLButtonElement>("[role=option]")[index]?.focus(); }
  function show(index = Math.max(0, options.indexOf(value))) { setOpen(true); requestAnimationFrame(() => focusOption(index)); }
  function close() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className={styles.root} ref={root} style={{ "--status-color": colors[value] } as React.CSSProperties} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`} type="button" disabled={disabled} aria-label={`${label}: ${value}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); } }}>
      <span className={styles.dot} /><span>{all && value === "All" ? "All statuses" : value}</span><svg className={styles.chevron} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
    </button>
    <div id={id} className={`${styles.menu} ${open ? styles.open : ""}`} role="listbox" aria-label={label} inert={!open} onKeyDown={event => {
      const index = [...(root.current?.querySelectorAll("[role=option]") || [])].indexOf(document.activeElement as Element);
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); focusOption((index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length); }
      if (event.key === "Home" || event.key === "End") { event.preventDefault(); focusOption(event.key === "Home" ? 0 : options.length - 1); }
    }}>
      {options.map(option => <button type="button" role="option" aria-selected={option === value} key={option} className={styles.option} style={{ "--status-color": colors[option] } as React.CSSProperties} onClick={() => { onChange(option); close(); }}><span className={styles.dot} /><span>{option === "All" ? "All statuses" : option}</span>{value === option && <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}</button>)}
    </div>
  </div>;
}
