import AccountShell from "../../components/AccountShell";
import ApplicationsDashboard from "../../components/ApplicationsDashboard";
export const metadata = { alternates: { canonical: null }, title: "Applications | WantAnInternship", robots: { index: false, follow: false } };
export default function ApplicationsPage() { return <AccountShell showNavigation><ApplicationsDashboard /></AccountShell>; }
