# WantAnInternship

A no-login internship application tracker and searchable discovery directory. Applications are stored in the visitor's browser. The Software track also includes automatically refreshed Latest Drops from public employer job feeds.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Main routes

- `/` — applications tracker with search, filters, sorting and due dates;
- `/applications/new` — add a saved role or an application already submitted;
- `/applications/[id]` — edit, update or delete a tracked application;
- `/discover` — internship resources and the Latest Drops sidebar; and
- `/latest-drops` — complete recent software opportunity feed.

Tracked applications use browser `localStorage`, so they remain on the same browser and device without requiring an account.

## Deploy

Import the repository into Vercel. The directory works without environment variables. To enable live Software internship drops, deploy the AWS stack in [`infra/`](infra/README.md) and set `INTERNSHIPS_API_URL` in Vercel.

## Customize

- Edit resource listings in `data/resources.ts`
- Edit Software internship sources in `infra/lambda/sources.json`
- Change tracker content in `app/page.tsx` and `components/ApplicationsDashboard.tsx`
- Change discovery content in `app/discover/page.tsx`
- Change visual styling in `app/globals.css`

## Latest Software Drops

The `/latest-drops` page and homepage Software sidebar request `/api/internships`.
Without AWS, this route reads the public employer feeds directly with a five-minute
server cache. With AWS configured, DynamoDB adds durable discovery history and
closed-job tracking. If every live source is unavailable, the UI falls back to the
curated Software employer links in `data/tracks.ts`.
