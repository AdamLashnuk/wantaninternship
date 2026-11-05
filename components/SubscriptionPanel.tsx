import Link from "next/link";
import styles from "./SubscriptionPanel.module.css";

export default function SubscriptionPanel() {
  return <section className={styles.panel} aria-labelledby="subscription-heading">
    <span className={styles.eyebrow}>YOUR SUBSCRIPTION</span>
    <h1 id="subscription-heading">Everything you need. Free.</h1>
    <p className={styles.subtitle}>One plan, with access to every available feature. No card required.</p>
    <div className={styles.plan}>
      <div className={styles.planHeading}><h2>Free</h2><span>Current plan</span></div>
      <div className={styles.price}>$0<span> / month</span></div>
      <ul>
        <li>Complete Latest Drops feed and filters</li>
        <li>Curated software and engineering directories</li>
        <li>Unlimited saved internships and application tracking</li>
        <li>Application flow graph and progress tools</li>
        <li>All available features included</li>
      </ul>
      <p>No trial, upgrade or payment needed. Sign in to save your applications and preferences.</p>
    </div>
    <div className={styles.links}><Link href="/latest-drops">Browse internships</Link><Link href="/applications">Your applications</Link></div>
  </section>;
}
