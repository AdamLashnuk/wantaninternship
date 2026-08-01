import type { Metadata } from "next";
import "./globals.css";

const themeInitializationScript = `
  (function () {
    var theme = "light";

    try {
      var savedTheme = localStorage.getItem("wantaninternship-theme");
      theme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (error) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    document.documentElement.dataset.theme = theme;
  })();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
