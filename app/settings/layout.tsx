import AccountShell from '../../components/AccountShell';
import MatchingSettings from '../../components/MatchingSettings';
export const metadata = { title: 'Settings | WantAnInternship', alternates: { canonical: null }, robots: { index: false, follow: false } };
export default function SettingsLayout({ children }: { children: React.ReactNode }) { return <AccountShell showNavigation><MatchingSettings />{children}</AccountShell>; }
