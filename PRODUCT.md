# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

U.S. college students, international students, and recent graduates looking for internships and early-career opportunities. They use WantAnInternship to discover relevant openings and preparation resources without navigating unrelated listings or creating another account.

## Product Purpose

WantAnInternship makes internship discovery simpler by bringing curated career resources and current opportunities into one clean, easy-to-navigate directory. Success means users can quickly find useful opportunities for their career track and continue to the original source with minimal friction.

## Positioning

Unlike account-based career platforms, WantAnInternship combines opportunities discovered from relevant GitHub repositories and public employer or job-board feeds in a free directory that requires no account. Its value is broad collection with a simpler path to the original opportunity.

## Operating Context

Users browse by career track, search and filter curated resources, review live Software Latest Drops, explore career-preparation tools, and follow links to original employers or platforms. Community members can submit new resources or report outdated listings by email.

## Capabilities and Constraints

- Offer exactly two career tracks: Software and Engineering.
- Keep the service free to use and available without an account.
- Preserve direct links to original employer, applicant-tracking-system, GitHub, and resource pages.
- Software Latest Drops aggregate normalized public listings from employer feeds and selected GitHub discovery sources; source attribution remains visible.
- Keep navigation exceptionally simple, clean, and easy to understand.
- The existing stack is Next.js 15, React 19, and TypeScript, with optional AWS infrastructure for durable Software listing history.

## Brand Commitments

- Preserve the name **WantAnInternship**.
- Preserve the straightforward, student-friendly voice.
- The product must feel clean and effortless to navigate.

## Evidence on Hand

- Curated resources and metadata live in `data/resources.ts`.
- Career-track definitions and recommendations live in `data/tracks.ts`.
- Career-tool listings live in `data/tools.ts`.
- Software listing provenance and collection behavior are documented in `docs/DATA_SOURCES.md`.
- The repository contains no confirmed testimonials, customer logos, performance claims, or outcome metrics; future work must not fabricate them.

## Product Principles

1. Remove barriers between a student and a useful opportunity.
2. Prefer a focused, understandable directory over account-driven complexity.
3. Preserve clear separation between career tracks while keeping the overall experience consistent.
4. Send users to authoritative original sources and keep provenance visible.
5. Make freshness, trust, and ease of navigation more important than feature volume.

