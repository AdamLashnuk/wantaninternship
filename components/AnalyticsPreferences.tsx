"use client";
export default function AnalyticsPreferences() {
  return <button onClick={() => { try { localStorage.removeItem("wai-google-analytics-consent"); } catch {} window.location.assign("/"); }}>Reset Google Analytics choice</button>;
}
