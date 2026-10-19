import type { Metadata } from "next";
import AccountShell from "../../components/AccountShell";
import LoginForm from "../../components/LoginForm";

export const metadata: Metadata = { title: "Log in or Sign up | WantAnInternship" };
export default function LoginPage() { return <AccountShell><LoginForm /></AccountShell>; }
