"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "./AccountProvider";
import { useBilling } from "./BillingProvider";
import styles from "./SubscriptionPanel.module.css";
const date = (value: number) => new Date(value * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
export default function SubscriptionPanel() {
  const { user, loading: accountLoading } = useAccount();
  const { billing, loading, error: loadError, refresh } = useBilling();
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [code, setCode] = useState(""); const [notice, setNotice] = useState("");
  const router = useRouter();
  useEffect(() => { if (new URLSearchParams(window.location.search).get("checkout") === "canceled") setNotice("Checkout was canceled. You can keep using the free plan."); }, []);
  useEffect(() => { if (!accountLoading && !user) router.replace("/login?next=/subscription"); }, [accountLoading, user, router]);
  useEffect(() => {
    if (!user || new URLSearchParams(window.location.search).get("checkout") !== "success") return;
    let stopped = false; let tries = 0; let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try { const status = await refresh(); if (stopped) return; if (status.premium) { setNotice("Your Premium access is ready."); return; } } catch { /* Show the provider error and keep a manual retry available. */ }
      if (!stopped && ++tries < 6) timer = setTimeout(check, 2000); else if (!stopped) setNotice("Checkout returned successfully. We’re still confirming your subscription; refresh your status in a moment.");
    };
    void check(); return () => { stopped = true; clearTimeout(timer); };
  }, [user?.id, refresh]);
  async function action(name: "checkout" | "portal" | "redeem") {
    setBusy(name); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/billing/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(name === "redeem" ? { code } : {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to complete that request.");
      if (result.url) { const url = new URL(result.url); if (url.protocol !== "https:" || !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname)) throw new Error("Invalid checkout destination."); window.location.assign(url.toString()); }
      else { await refresh(); setCode(""); setNotice("Your free Premium access is active. No card or subscription charge is required."); }
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(""); }
  }
  if (!user) return <p role="status">Loading your subscription…</p>;
  return <section className={styles.panel}>
    <span className={styles.eyebrow}>YOUR MEMBERSHIP</span><h1>{billing.premium ? "You’re on Premium." : "More opportunities. One place."}</h1>
    <p className={styles.subtitle}>Stay on top of fresh openings and every application.</p>
    {billing.testMode && <p className={styles.notice}>Test mode — checkout uses test payments.</p>}
    <div className={styles.plan}><div className={styles.planHeading}><h2>WantAnInternship Premium</h2><span>{billing.complimentary ? "Free access" : billing.status === "trialing" ? "Free trial" : billing.premium ? "Active" : "Free plan"}</span></div>
      <div className={styles.price}>{billing.complimentary ? "$0" : "$9.99"}<span> / month</span></div>
      <ul><li>Complete Latest Drops feed for software and engineering</li><li>Advanced search and filters</li><li>Unlimited saved applications and notes</li><li>Animated application flow chart</li></ul>
      {billing.complimentary ? <p>Your access code covers Premium indefinitely. No card required.</p> : billing.premium ? <p>{billing.cancelAtPeriodEnd && billing.accessUntil ? `Your subscription ends on ${date(billing.accessUntil)}. Access remains available until then.` : billing.status === "trialing" && billing.trialEnd ? `Your trial ends on ${date(billing.trialEnd)}. Then $9.99/month unless you cancel before that date.` : billing.accessUntil ? `Current billing period ends ${date(billing.accessUntil)}.` : "Your Premium access is active."}</p> : <>
        <button className={styles.primary} type="button" disabled={Boolean(busy) || loading || !billing.billingReady} onClick={() => void action("checkout")}>{busy === "checkout" ? "Opening checkout…" : billing.trialEligible ? "Start 7-day free trial" : "Subscribe for $9.99/month"}</button>
        <p className={styles.terms}>{billing.trialEligible ? "Card required. $0 today, then $9.99 USD/month, automatically renewing until canceled. Your exact trial end date is shown during checkout." : "$9.99 USD/month, automatically renewing until canceled."}</p>
        {!loading && !billing.billingReady && <p className={styles.terms}>Payments are being set up. You can still redeem an access code below once account services are connected.</p>}
      </>}
      {billing.hasCustomer && !billing.complimentary && <button className={styles.secondary} type="button" disabled={Boolean(busy)} onClick={() => void action("portal")}>{busy === "portal" ? "Opening billing…" : "Manage subscription"}</button>}
    </div>
    {!billing.complimentary && <form className={styles.codeForm} onSubmit={event => { event.preventDefault(); void action("redeem"); }}><label htmlFor="access-code">Have an access code?</label><div><input id="access-code" value={code} onChange={event => setCode(event.target.value)} maxLength={100} autoComplete="off" placeholder="Enter your code" required disabled={Boolean(busy)} /><button type="submit" className={styles.secondary} disabled={Boolean(busy) || !code.trim()}>{busy === "redeem" ? "Applying…" : "Apply code"}</button></div></form>}
    {(error || loadError) && <p className={styles.error} role="alert">{error || loadError} <button type="button" onClick={() => void refresh().catch(() => {})}>Refresh status</button></p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <div className={styles.links}><Link href="/latest-drops">Browse latest drops</Link><Link href="/applications">Your application tracker</Link></div>
  </section>;
}
