"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-F3RDZCL8PM";
const enabled = /^G-[A-Z0-9]+$/.test(measurementId);
const publicPaths = new Set(["/", "/directory", "/latest-drops", "/tools", "/software-internships", "/engineering-internships"]);
const consentKey = "wai-google-analytics-consent";
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setConsent(localStorage.getItem(consentKey) || "ask"); } catch { setConsent("declined"); }
  }, []);
  const publicPage = publicPaths.has(pathname);
  useEffect(() => {
    if (!loaded || consent !== "granted" || !publicPage) return;
    // Never send query strings, referrers, account identifiers or private page titles.
    window.gtag?.("event", "page_view", {
      page_location: `https://wantaninternship.com${pathname}`,
      page_title: document.title,
      page_referrer: "",
    });
  }, [pathname, consent, loaded, publicPage]);
  if (!enabled || !publicPage || !consent) return null;
  function choose(value: string) {
    try { localStorage.setItem(consentKey, value); } catch { /* Use this session's choice. */ }
    setConsent(value);
  }
  return <>
    {consent === "ask" && <aside className="analytics-consent" aria-label="Analytics preferences"><p>Allow Google Analytics to help us understand visits to public pages? Your resume and account pages are excluded. <a href="/privacy">Details</a></p><button onClick={() => choose("granted")}>Allow</button><button onClick={() => choose("declined")}>No thanks</button></aside>}
    {consent === "granted" && <Script id="wai-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" onReady={() => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false, page_location: `https://wantaninternship.com${pathname}`, page_referrer: "", allow_google_signals: false, allow_ad_personalization_signals: false });
      setLoaded(true);
    }} />}
  </>;
}
