import AccountShell from "../../components/AccountShell";
import ApplicationsDashboard from "../../components/ApplicationsDashboard";
export const metadata = { title: "Applications | WantAnInternship" };
export default function ApplicationsPage() { return <AccountShell showNavigation><ApplicationsDashboard /></AccountShell>; }
