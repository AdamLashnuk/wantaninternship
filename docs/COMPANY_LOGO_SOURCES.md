# Company logo sources

Latest Drops gets each company image automatically from the employer website
configured beside its job-board source. The interface passes that website's
hostname to Google's favicon service:

```text
https://www.google.com/s2/favicons?domain={company-hostname}&sz=128
```

Google returns a cached, resized copy of the favicon published by that official
website. If the site has no usable favicon or the request fails, the interface
falls back to the company's initials.

## Configured employer websites

| Company | Official website used for its favicon |
| --- | --- |
| Airbnb | https://www.airbnb.com |
| Capital One | https://www.capitalone.com |
| Cloudflare | https://www.cloudflare.com |
| Databricks | https://www.databricks.com |
| Datadog | https://www.datadoghq.com |
| Discord | https://discord.com |
| Duolingo | https://www.duolingo.com |
| Figma | https://www.figma.com |
| Lyft | https://www.lyft.com |
| Microsoft | https://www.microsoft.com |
| Ramp | https://ramp.com |
| Robinhood | https://robinhood.com |
| Roblox | https://www.roblox.com |
| SpaceX | https://www.spacex.com |

## Adding a future source

Add the employer's official homepage as `website` in both the application feed
source and `infra/lambda/sources.json`. The collector stores it as
`companyWebsite`, so the UI can load the correct favicon without adding or
maintaining a local image file.

Company names and logos remain trademarks of their respective owners.
