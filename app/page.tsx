import type { Metadata } from "next";
import ApplicationsDashboard from "../components/ApplicationsDashboard";

export const metadata: Metadata = {
  title: "Applications | WantAnInternship",
  description: "Track internship applications, next steps, and recent updates.",
};

export default function ApplicationsPage() {
  return <ApplicationsDashboard />;
}
