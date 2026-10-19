import type { Metadata } from "next";
import AccountShell from "../../components/AccountShell";
import AccountDetails from "../../components/AccountDetails";
export const metadata: Metadata = { title: "Your Profile | WantAnInternship", robots: { index: false } };
export default function ProfilePage() { return <AccountShell><AccountDetails /></AccountShell>; }
