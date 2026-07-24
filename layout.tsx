import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InternDock — Every place to find internships",
  description: "A curated directory of job boards, GitHub repositories, startup platforms, research programs, and internship resources.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
