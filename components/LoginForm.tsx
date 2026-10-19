"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "./AccountProvider";
import styles from "./AccountPages.module.css";

type Mode = "login" | "signup" | "confirm";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { user, loading, refresh } = useAccount();
  const router = useRouter();

  useEffect(() => { if (!loading && user) router.replace("/"); }, [user, loading, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, name, email, password, code }) });
      const result = await response.json();
      if (!response.ok) {
        if (result.code === "UserNotConfirmedException") { setMode("confirm"); setPassword(""); }
        throw new Error(result.error);
      }
      if (mode === "signup" && result.needsConfirmation) {
        setMode("confirm"); setPassword(""); setNotice("We sent a six-digit verification code to your email.");
      } else if (mode === "confirm" || mode === "signup") {
        setMode("login"); setPassword(""); setCode(""); setNotice("Your account is ready. Log in to continue.");
      } else {
        setPassword(""); await refresh(); router.replace("/"); router.refresh();
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  const changeMode = (next: Mode) => { setMode(next); setError(""); setNotice(""); setPassword(""); setCode(""); };

  return <section className={styles.card}>
    <span className={styles.kicker}>Your next chapter</span>
    <h1>{mode === "signup" ? "Make room for opportunity." : mode === "confirm" ? "Check your inbox." : "Good to see you."}</h1>
    <p className={styles.subtitle}>{mode === "signup" ? "Create your WantAnInternship account." : mode === "confirm" ? `Enter the verification code sent to ${email}.` : "Log in and pick up where you left off."}</p>
    {mode !== "confirm" && <div className={styles.tabs} aria-label="Account options">
      <button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} disabled={busy}>Log in</button>
      <button type="button" aria-pressed={mode === "signup"} onClick={() => changeMode("signup")} disabled={busy}>Sign up</button>
    </div>}
    <form onSubmit={submit} className={styles.form}>
      {mode === "signup" && <label>Your name<input name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required disabled={busy} placeholder="Alex Morgan" /></label>}
      {mode !== "confirm" && <label>Email address<input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} disabled={busy} placeholder="you@university.edu" /></label>}
      {mode !== "confirm" && <label>Password<span className={styles.passwordInput}><input type={showPassword ? "text" : "password"} name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "signup" ? 12 : 1} maxLength={256} disabled={busy} required placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"} aria-describedby={mode === "signup" ? "password-hint" : undefined} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></span>{mode === "signup" && <small id="password-hint">12+ characters, with uppercase, lowercase, and a number.</small>}</label>}
      {mode === "confirm" && <label>Verification code<input name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} disabled={busy} required placeholder="000000" /></label>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "confirm" ? "Verify email" : "Log in"}<span aria-hidden="true">→</span></button>
    </form>
    {mode === "confirm" ? <div className={styles.footer}>
      <button disabled={busy} type="button" onClick={async () => { setBusy(true); setError(""); try {
        const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resend", email }) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error); setNotice("A new verification code is on its way.");
      } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>Send a new code</button>
      <button type="button" disabled={busy} onClick={() => changeMode("login")}>Back to log in</button>
    </div> : <p className={styles.footer}>{mode === "login" ? "New around here?" : "Already have an account?"} <button type="button" disabled={busy} onClick={() => changeMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></p>}
    <Link className={styles.back} href="/">← Back to opportunities</Link>
  </section>;
}
