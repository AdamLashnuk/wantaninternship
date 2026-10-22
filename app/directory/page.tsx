import { pageMetadata } from "../../lib/seo";
import type { Metadata } from "next";
import HomeExperience from "../../components/HomeExperience";

export const metadata: Metadata = pageMetadata('Recommended Internship Websites | WantAnInternship', 'Explore curated software and engineering internship websites, job boards and application resources. Find the right places to look for your next internship.', '/directory');

export default function ResourceDirectoryPage() {
  return <HomeExperience />;
}
