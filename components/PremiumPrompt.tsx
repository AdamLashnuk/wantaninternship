"use client";
import Link from "next/link";
import { useAccount } from "./AccountProvider";
import { useBilling } from "./BillingProvider";
import styles from "./SubscriptionPanel.module.css";
export default function PremiumPrompt({ tracker = false, graph = false }: { tracker?: boolean; graph?: boolean }) {
  const { user } = useAccount(); const { billing } = useBilling();
  return <div className={styles.prompt}>
    <div><span className={styles.eyebrow}>WANTANINTERNSHIP PREMIUM</span><h2>{graph ? "See your application flow" : tracker ? "Make room for your next opportunity" : "Keep going. Your next opening could be here."}</h2><p>{graph ? "Visualize your progress with an animated application flow and unlimited tracking." : tracker ? "Track unlimited internships, add notes, and follow every application in one place." : "Unlock the complete Latest Drops feed, advanced filters, and unlimited application tracking."}</p></div>
    <Link className={styles.primary} href={user ? "/subscription" : "/login?next=/subscription"}>{billing.trialEligible ? "Start 7-day free trial" : "Get Premium"}</Link>
    <small>{billing.trialEligible ? "7 days free, then $9.99/month. Cancel before your trial ends to avoid a charge." : "$9.99/month. Cancel anytime."}</small>
  </div>;
}
