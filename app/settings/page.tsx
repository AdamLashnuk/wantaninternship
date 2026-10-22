import type { Metadata } from 'next';
import AccountShell from '../../components/AccountShell';
import MatchingSettings from '../../components/MatchingSettings';
export const metadata: Metadata = { alternates: { canonical: null }, title: 'Settings | WantAnInternship', robots: { index: false, follow: false } };
export default function SettingsPage() { return <AccountShell showNavigation><MatchingSettings /></AccountShell>; }
