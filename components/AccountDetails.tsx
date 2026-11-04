"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "./AccountProvider";
import styles from "./AccountPages.module.css";

export default function AccountDetails() {
  const { user, loading } = useAccount();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (!user) return <p className={styles.subtitle} role="status">Loading your account…</p>;
  return <section className={styles.card}>
    <span className={styles.kicker}>Your account</span><h1>Your profile.</h1>
    <p className={styles.subtitle}>The essentials, all in one place. Free to use.</p>
    <dl className={styles.details}><div><dt>Name</dt><dd>{user.name || "Not provided"}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div></dl>
    <Link className={styles.secondary} href="/settings">Account settings</Link>
    <Link className={styles.back} href="/">Back to opportunities</Link>
  </section>;
}
