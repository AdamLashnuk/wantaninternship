import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/latest-drops", "/directory", "/tools", "/software-internships", "/engineering-internships"].map(path => ({ url: `${siteUrl}${path}`, changeFrequency: path === "" || path === "/latest-drops" ? "daily" : "weekly", priority: path === "" ? 1 : 0.8 }));
}
