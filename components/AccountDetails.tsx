"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "./AccountProvider";
import styles from "./AccountPages.module.css";

export default function AccountDetails({ subscription = false }: { subscription?: boolean }) {
  const { user, loading } = useAccount();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [user, loading, router]);
  if (!user) return <p className={styles.subtitle} role="status">Loading your account…</p>;
  return <section className={styles.card}>
    <span className={styles.kicker}>{subscription ? "Your membership" : "Your account"}</span>
    <h1>{subscription ? "A little more possibility." : "Your profile."}</h1>
    {subscription ? <>
      <p className={styles.subtitle}>You’re on the free plan.</p>
      <div className={styles.plan}><span className={styles.planTag}>Current plan</span><h2>Free</h2><p>Browse internships and recommended websites.</p></div>
      <p className={styles.subtitle}>Paid subscriptions aren’t available yet. There are no charges on your account.</p>
    </> : <>
      <p className={styles.subtitle}>The essentials, all in one place.</p>
      <dl className={styles.details}><div><dt>Name</dt><dd>{user.name || "Not provided"}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div></dl>
      <Link className={styles.secondary} href="/subscription">View subscription <span aria-hidden="true">→</span></Link>
    </>}
    <Link className={styles.back} href="/">← Back to opportunities</Link>
  </section>;
}
