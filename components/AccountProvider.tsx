"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AccountUser } from "../lib/auth";

type AccountState = { user: AccountUser | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void> };
const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (response.ok) setUser((await response.json()).user);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh().catch(() => {});
    const onFocus = () => { void refresh().catch(() => {}); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);
  const logout = useCallback(async () => {
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    if (!response.ok) throw new Error("We couldn't log you out. Please try again.");
    setUser(null);
    window.location.assign("/");
  }, []);
  return <AccountContext.Provider value={{ user, loading, refresh, logout }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const state = useContext(AccountContext);
  if (!state) throw new Error("AccountProvider is required");
  return state;
}
