export type CompanyLogoInfo = {
  src: string;
  sourceName: string;
  sourceUrl: string;
};

export const companyLogos: Record<string, CompanyLogoInfo> = {
  Datadog: {
    src: "/company-logos/datadog.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/datadog",
  },
  Duolingo: {
    src: "/company-logos/duolingo.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/duolingo",
  },
  Cloudflare: {
    src: "/company-logos/cloudflare.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/cloudflare",
  },
  Databricks: {
    src: "/company-logos/databricks.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/databricks",
  },
  Figma: {
    src: "/company-logos/figma.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/figma",
  },
  Discord: {
    src: "/company-logos/discord.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/discord",
  },
  Lyft: {
    src: "/company-logos/lyft.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/lyft",
  },
  Airbnb: {
    src: "/company-logos/airbnb.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/airbnb",
  },
  Roblox: {
    src: "/company-logos/roblox.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/roblox",
  },
  SpaceX: {
    src: "/company-logos/spacex.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/spacex",
  },
  Robinhood: {
    src: "/company-logos/robinhood.svg",
    sourceName: "Simple Icons",
    sourceUrl: "https://cdn.simpleicons.org/robinhood",
  },
  Ramp: {
    src: "https://ramp.com/favicon.ico",
    sourceName: "Ramp official website",
    sourceUrl: "https://ramp.com/favicon.ico",
  },
};

export function getCompanyLogo(company: string) {
  return companyLogos[company];
}
