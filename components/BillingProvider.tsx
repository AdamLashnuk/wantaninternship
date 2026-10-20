"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAccount } from "./AccountProvider";
export type BillingStatus = { premium: boolean; complimentary: boolean; status: string; accessUntil: number | null; trialEnd: number | null; cancelAtPeriodEnd: boolean; trialEligible: boolean; hasCustomer: boolean; billingReady: boolean; testMode: boolean };
const free: BillingStatus = { premium: false, complimentary: false, status: "free", accessUntil: null, trialEnd: null, cancelAtPeriodEnd: false, trialEligible: true, hasCustomer: false, billingReady: false, testMode: false };
const Context = createContext<{ billing: BillingStatus; loading: boolean; error: string; refresh: () => Promise<BillingStatus> } | null>(null);
export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: accountLoading } = useAccount();
  const [billing, setBilling] = useState(free);
  const [owner, setOwner] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!user?.id) { setBilling(free); setOwner(undefined); setLoading(false); setError(""); return free; }
    try {
      const response = await fetch("/api/billing/status", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load subscription access.");
      setBilling(result); setOwner(user.id); setError(""); return result as BillingStatus;
    } catch (error) { setBilling(free); setError((error as Error).message); throw error; }
    finally { setLoading(false); }
  }, [user?.id]);
  useEffect(() => {
    if (accountLoading) return;
    setLoading(true); void refresh().catch(() => {});
    const focus = () => { void refresh().catch(() => {}); };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [accountLoading, refresh]);
  useEffect(() => {
    if (!billing.premium || billing.complimentary || !billing.accessUntil) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const remaining = billing.accessUntil! * 1000 - Date.now();
      if (remaining <= 0) { void refresh().catch(() => {}); return; }
      timer = setTimeout(check, Math.min(remaining + 1000, 86400000));
    };
    check(); return () => clearTimeout(timer);
  }, [billing.premium, billing.complimentary, billing.accessUntil, refresh]);
  return <Context.Provider value={{ billing: owner === user?.id ? billing : free, loading: loading || accountLoading, error, refresh }}>{children}</Context.Provider>;
}
export function useBilling() { const context = useContext(Context); if (!context) throw new Error("BillingProvider required"); return context; }
