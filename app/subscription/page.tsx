import type { Metadata } from "next";
import AccountShell from "../../components/AccountShell";
import AccountDetails from "../../components/AccountDetails";
export const metadata: Metadata = { title: "Your Subscription | WantAnInternship", robots: { index: false } };
export default function SubscriptionPage() { return <AccountShell><AccountDetails subscription /></AccountShell>; }
