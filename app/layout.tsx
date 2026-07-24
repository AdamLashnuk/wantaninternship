import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WantanInternship",
  description:
    "A curated directory of internship websites, GitHub repositories, startup job boards, research programs and government opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}