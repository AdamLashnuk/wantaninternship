import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { pageMetadata, siteUrl } from "../lib/seo";
import { BillingProvider } from "../components/BillingProvider";
import { AccountProvider } from "../components/AccountProvider";

const themeInitializationScript = `
  (function () {
    var theme = "dark";

    try {
      var savedTheme = localStorage.getItem("wantaninternship-theme");
      theme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "dark";
    } catch (error) {
      theme = "dark";
    }

    document.documentElement.dataset.theme = theme;
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...pageMetadata("Software & Engineering Internships | WantAnInternship", "Find fresh software and engineering internships, explore curated internship websites, and organize your applications with WantAnInternship.", "/"),
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <AccountProvider><BillingProvider>{children}</BillingProvider></AccountProvider>
        <Analytics />
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: "WantAnInternship", url: siteUrl }, { "@type": "WebSite", name: "WantAnInternship", url: siteUrl }] }) }} />
      </body>
    </html>
  );
}
