# WantanInternship

A polished, searchable directory of internship job boards, GitHub repositories, startup platforms, government portals, and research programs. The Software and Engineering tracks also include automatically refreshed Latest Drops.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Import the repository into Vercel. The directory works without environment variables. To enable live Software and Engineering drops, deploy the AWS stack in [`infra/`](infra/README.md) and set `INTERNSHIPS_API_URL` in Vercel.

## Customize

- Edit resource listings in `data/resources.ts`
- Edit direct employer sources in `infra/lambda/sources.json`
- Edit Software and Engineering GitHub sources in `infra/lambda/github-sources.json`
- Change homepage content in `app/page.tsx`
- Change visual styling in `app/globals.css`

## Latest Drops

The `/latest-drops` page and Software/Engineering homepage sidebars request `/api/internships`.
Without AWS, this route reads the public employer feeds directly with a five-minute
server cache. With AWS configured, DynamoDB adds durable discovery history and
closed-job tracking. If every live source is unavailable, the UI falls back to the
curated Software employer links in `data/tracks.ts`.
