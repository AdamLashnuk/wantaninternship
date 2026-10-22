'use client';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './MatchingSettings.module.css';
export type Choice = { value: string; label: string; description?: string };
export default function SettingsDropdown({ label, value, options, onChange, multiple = false, custom = false, placeholder = 'Choose an option', hint, disabled = false }: { label: string; value: string[]; options: Choice[]; onChange: (values: string[]) => void; multiple?: boolean; custom?: boolean; placeholder?: string; hint?: string; disabled?: boolean }) {
  const id = useId(); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false); const [up, setUp] = useState(false); const [search, setSearch] = useState(''); const [active, setActive] = useState(0);
  const all: Choice[] = [...options, ...value.filter(v => !options.some(o => o.value === v)).map(v => ({ value: v, label: v }))];
  const filtered = all.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const canAdd = custom && search.trim().length > 0 && !all.some(o => o.value.toLowerCase() === search.trim().toLowerCase());
  const choices: Choice[] = [...filtered, ...(canAdd ? [{ value: search.trim(), label: `Add “${search.trim()}”` }] : [])];
  const searchable = multiple || custom || all.length > 7;
  const summary = value.map(v => all.find(o => o.value === v)?.label || v);
  function close() { setOpen(false); setSearch(''); setActive(0); }
  function select(v: string) {
    if (multiple) { onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v].slice(0, 50)); setSearch(''); setActive(0); }
    else { onChange([v]); close(); trigger.current?.focus(); }
  }
  useEffect(() => {
    if (!open) return;
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) setUp(window.innerHeight - rect.bottom < 330 && rect.top > window.innerHeight - rect.bottom);
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  return <div className={styles.field} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) close(); }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); trigger.current?.focus(); }
    if (open && ['ArrowDown','ArrowUp','Enter'].includes(event.key)) {
      if (event.key === 'Enter') { if ((event.target as HTMLElement).getAttribute('role') === 'option') return; event.preventDefault(); if (choices[active]) select(choices[active].value); }
      else { event.preventDefault(); const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % Math.max(1, choices.length); setActive(next); document.getElementById(`${id}-option-${next}`)?.scrollIntoView({block:'nearest'}); }
    }
  }}>
    <span id={`${id}-label`} className={styles.label}>{label}</span>
    <div className={styles.selectWrap}>
      <button ref={trigger} type="button" className={styles.selectButton} disabled={disabled} role="combobox" aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox" aria-activedescendant={open && choices[active] ? `${id}-option-${active}` : undefined} onClick={() => setOpen(v => !v)} onKeyDown={event => { if (!open && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); } }}>
        <span className={!summary.length ? styles.placeholder : ''}>{summary.length ? `${summary.slice(0, 2).join(', ')}${summary.length > 2 ? ` +${summary.length - 2}` : ''}` : placeholder}</span><svg className={open ? styles.chevronOpen : ''} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
      </button>
      {open && <div className={`${styles.dropdown} ${up ? styles.dropdownUp : ''}`}>
        {searchable && <input aria-label={`Search ${label.toLowerCase()}`} placeholder={custom ? 'Search or type your own…' : 'Search options…'} value={search} maxLength={100} autoFocus onChange={event => { setSearch(event.target.value); setActive(0); }} aria-controls={`${id}-list`} aria-activedescendant={choices[active] ? `${id}-option-${active}` : undefined} />}
        <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} aria-multiselectable={multiple || undefined} className={styles.optionList}>
          {choices.map((o, i) => <button key={o.value} type="button" id={`${id}-option-${i}`} role="option" aria-selected={value.includes(o.value)} className={`${styles.option} ${active === i ? styles.optionActive : ''}`} onPointerMove={() => setActive(i)} onClick={() => select(o.value)}><span><b>{o.label}</b>{o.description && <small>{o.description}</small>}</span><svg viewBox="0 0 16 16" aria-hidden="true" style={{opacity:value.includes(o.value) ? 1 : 0}}><path d="m3 8 3 3 7-7"/></svg></button>)}
          {!choices.length && <p className={styles.noOptions}>No options found.</p>}
        </div>
        {multiple && <div className={styles.dropdownFooter}><span>{value.length} selected</span><button type="button" onClick={() => onChange([])}>Clear</button><button type="button" onClick={() => { close(); trigger.current?.focus(); }}>Done</button></div>}
      </div>}
    </div>
    {multiple && value.length > 0 && <div className={styles.selectionChips}>{value.map(v => <button key={v} type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter(x => x !== v))}>{all.find(o => o.value === v)?.label || v}<span aria-hidden="true">×</span></button>)}</div>}
    {hint && <small className={styles.hint}>{hint}</small>}
  </div>;
}
