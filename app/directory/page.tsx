import type { Metadata } from "next";
import HomeExperience from "../../components/HomeExperience";

export const metadata: Metadata = {
  title: "Recommended Internship Websites | WantAnInternship",
  description: "Browse our recommended software and engineering job boards, GitHub lists, and student resources.",
};

export default function ResourceDirectoryPage() {
  return <HomeExperience />;
}
