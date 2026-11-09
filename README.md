# How about

Ideas for how South African brands could do better — submitted and upvoted
by the people who shop there. This is the MVP web scaffold: brand pages,
idea submission with duplicate detection, and a brand dashboard.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Postgres via Prisma 6 (`prisma/schema.prisma`)
- Server Actions for mutations (`src/app/actions.ts`) — no separate API layer yet

## Setup

1. **Get a Postgres database.** Easiest options: a free [Supabase](https://supabase.com) or [Neon](https://neon.tech) project — both give you a connection string in under a minute. A local Postgres install works too.
2. Copy the env file and fill in your connection string:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies, create the tables, and seed sample data:
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```
4. Run it:
   ```bash
   npm run dev
   ```
   Visit `/brands/woolworths`, `/brands/club-mall`, or `/brands/plato` — these are seeded with the example ideas from planning (the milk boxes, parking app, pumpkin coffee). `/dashboard/woolworths` shows the brand side.

## What's here vs. what's stubbed

Built:
- Brand idea feed with upvoting (`/brands/[slug]`)
- Idea submission with duplicate detection (`/brands/[slug]/submit`)
- Brand dashboard: metrics, respond + status (`/dashboard/[slug]`)

Deliberately stubbed for later (see inline comments where relevant):
- **Auth.** Every action currently runs as one demo user (`src/app/actions.ts`). Real accounts (web) and phone-number identity (WhatsApp) are the next piece.
- **Duplicate detection** (`src/lib/dedupe.ts`) uses a plain word-overlap heuristic, not embeddings. Swapping in pgvector + a real embedding model is a drop-in replacement for `similarity()` once that's wired up — the `Idea` model's schema comment notes where the vector column goes.
- **WhatsApp input.** Nothing here yet — the plan is to normalize WhatsApp messages into the same `createIdea` action this web form already calls, so the dedupe/moderation logic is never duplicated.
- **Brand dashboard analytics/settings tabs** — the freemium upsell surface. Not built; metrics shown are just the free-tier basics.
- **Moderation queue.** Ideas go live immediately; nothing currently blocks abuse/spam before publish.

## Deploying

Vercel (hosts this app) + Supabase or Neon (Postgres) is the recommended pairing — both have generous free tiers that comfortably cover early traffic.
