# WantanInternship

A polished, searchable directory of internship job boards, GitHub repositories, startup platforms, government portals, and research programs. The Software track also includes automatically refreshed Latest Drops from public employer job feeds.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Import the repository into Vercel. The directory works without environment variables. To enable live Software internship drops, deploy the AWS stack in [`infra/`](infra/README.md) and set `INTERNSHIPS_API_URL` in Vercel.

## Customize

- Edit resource listings in `data/resources.ts`
- Edit Software internship sources in `infra/lambda/sources.json`
- Change homepage content in `app/page.tsx`
- Change visual styling in `app/globals.css`

## Latest Software Drops

The `/latest-drops` page and homepage Software sidebar request `/api/internships`.
When AWS has not been configured or is temporarily unavailable, both surfaces
fall back to the curated Software employer links in `data/tracks.ts`.
