import type { Metadata } from "next";
import HomeExperience from "../../components/HomeExperience";

export const metadata: Metadata = {
  title: "Discover Internships | WantAnInternship",
  description:
    "Browse curated internship resources and recently posted technical opportunities.",
};

export default function DiscoverPage() {
  return <HomeExperience />;
}
