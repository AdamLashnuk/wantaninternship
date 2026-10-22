# Search and analytics setup

Frontend changes deploy through Vercel; these changes do not need SAM deployment.

## Search Console
1. Sign in at https://search.google.com/search-console.
2. Add a Domain property for `wantaninternship.com`. Copy Google's TXT verification record to your DNS provider and verify. Domain verification covers www/non-www and protocols.
3. Alternative: use a URL-prefix property for `https://wantaninternship.com`. For HTML-tag verification, set `GOOGLE_SITE_VERIFICATION` in Vercel to the **content value only**, then redeploy before verifying.
4. After the deployment, submit `https://wantaninternship.com/sitemap.xml` under Sitemaps.
5. Inspect the homepage and the two internship landing pages, test the live URLs, and request indexing. Submission does not guarantee indexing or rankings.

## Google Analytics 4
1. In https://analytics.google.com, create an account/property and a Web data stream for `https://wantaninternship.com`. Choose your actual reporting timezone and currency.
2. Copy the Measurement ID (`G-...`) into Vercel's **Production** environment as `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Redeploy; public Next.js variables are embedded at build time. No API secret is needed.
3. In the stream's Enhanced Measurement settings, disable automatic Page views (including browser-history events), outbound clicks, site search, form interactions, file downloads and video interactions. The integration sends sanitized page views manually; this prevents duplicate views and collection of unfiltered URLs/form information.
4. Open the deployed public homepage, choose Allow, and check GA Realtime. A property without its ID configured will collect nothing. Private routes do not send page views.
5. On your own browsers choose No thanks, or use Privacy & analytics to reset your choice and decline. This excludes future Google Analytics visits from those browsers, not past data or Vercel reports.

## Business Profile
Google excludes online-only businesses from Business Profiles. Create one only if the business actually qualifies through in-person customer contact. Do not add a fictitious address.

## Validation
Check `/robots.txt`, `/sitemap.xml`, unique canonical URLs, social previews, and noindex on account pages. Check mobile layouts and run https://pagespeed.web.dev/ on the deployed URL. A Lighthouse lab score is distinct from real-user Core Web Vitals, which require enough traffic over time.
