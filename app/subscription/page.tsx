import type { Metadata } from "next";
import AccountShell from "../../components/AccountShell";
import SubscriptionPanel from "../../components/SubscriptionPanel";
export const metadata: Metadata = { title: "Your Subscription | WantAnInternship", robots: { index: false } };
export default function SubscriptionPage() { return <AccountShell showNavigation><SubscriptionPanel /></AccountShell>; }
