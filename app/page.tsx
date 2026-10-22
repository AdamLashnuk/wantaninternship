import OpportunityRadar from "./mockups/opportunity-radar/page";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("Software & Engineering Internships | WantAnInternship", "Find fresh software and engineering internships, explore curated internship websites, and organize your applications with WantAnInternship.", "/");
export const revalidate = 300;
export default function Home() { return <OpportunityRadar />; }
