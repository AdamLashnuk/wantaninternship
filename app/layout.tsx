import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
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
  title: "WantAnInternship | Internship & New Grad Resources",
  description:
    "A curated directory and career toolkit for students and new grads finding internships, software engineering roles, research programs and early-career opportunities.",
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
      </body>
    </html>
  );
}
