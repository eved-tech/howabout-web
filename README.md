# How about

South Africa's public suggestion box — shoppers post ideas for how a brand
could do better, other shoppers cheer the ones they agree with, and the
brand can respond. See the "How About — Feature Wish List" Google Doc
(linked from Claude's memory for this project) for product direction,
brand voice, and the path-to-launch checklist; this file covers what's
actually built and how it fits together.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Postgres via Prisma 6, pinned (`prisma/schema.prisma`) — `prisma@latest`/8.x is an unusable restructured RC, don't upgrade
- Auth via Neon Managed Auth — email + password, required OTP email verification (`src/lib/auth/`, `/auth/*` pages)
- Server Actions for all mutations (`src/app/actions.ts`) — no separate API layer
- Hosted on Vercel (`vercel deploy --prod`, no GitHub remote — this repo is local-only); Postgres + auth via Neon, one branch (`main`) shared by local dev and production — there's no separate prod database, so schema migrations and any seed/admin action run for real the moment they're run locally

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

## Pages and how they fit together

- **`/`** — home page: a live "ideas submitted" stat, the idea feed (Latest /
  Most popular / Most comments / Growing tabs, search, optimistic "Cheer on"
  voting via `toggleCheer`), a brand logos strip, and placeholder sections
  (prizes, "when brands listened") awaiting real content.
- **`/submit`** → **`/submit/new`** — brand-search-first idea submission.
  Searching live-dedupes against existing brands; if nothing matches, the
  submitter can add the brand and post their idea in one step. That new
  brand is created with `approved: false` and stays hidden from every public
  query (search, home page, brand pages) until a human approves it — there's
  no approval UI yet, so that's currently a direct DB edit.
- **`/brands/[slug]`** — a brand's public idea feed, with `/brands/[slug]/submit`
  for submitting directly to a known brand (live dedupe-as-you-type via
  `checkSimilarIdea`). Voting here uses the older one-way `voteIdea` action;
  the home page's `toggleCheer` is a separate, newer toggle-vote action —
  these haven't been unified yet.
- **`/dashboard/[slug]`** — the brand-side view: metrics, and responding to/
  marking the status of ideas. Gated: redirects signed-out visitors to sign
  in, and shows an access-denied message to anyone signed in who isn't a
  `BrandOwner` of that brand. `respondToIdea` itself re-checks ownership
  server-side — the actual security boundary, not just the page.
- **`/admin`** — single page, gated to the `ADMIN_EMAIL` env var only. Lets
  the admin grant a brand's dashboard access to someone by email (creating
  their `User` row if they haven't signed up yet, and marking the brand
  `claimed`). Stand-in for a real self-serve brand sign-up/claim flow, which
  doesn't exist yet.
- **`/auth/*`** — sign-up/sign-in/sign-out via Neon Managed Auth, with
  required email OTP verification before a session is granted.

## Data model notes

- **`Brand.approved`** gates public visibility (see `/submit/new` above) —
  not to be confused with `Brand.claimed`, which just means a `BrandOwner`
  has been granted dashboard access.
- **`BrandOwner`** links a `User` to a `Brand` they can manage the dashboard
  for. Many-to-many in shape, granted only via `/admin` today.
- **`User`** rows are created lazily, keyed by email, the first time Neon
  Managed Auth reports a signed-in session for that address (`getCurrentUser`
  in `actions.ts`) — or earlier, if `/admin` pre-creates one when granting
  brand access ahead of that person signing up.

## Deliberately stubbed for later

- **Idea/person profile pages, comments on ideas.** Ideas only render inline
  on a brand's page today; no idea has its own URL yet. Needed before
  comments or idea-level sharing (copy link/WhatsApp/socials) can work.
- **Brand logos.** No real logo images yet — brand chips fall back to an
  initial. The plan is Vercel Blob storage for the files, referenced by a
  `logoUrl` field not yet added to `Brand`.
- **Phone-number identity (WhatsApp).** Web accounts don't cover WhatsApp
  senders yet. The plan is to normalize WhatsApp messages into the same
  `createIdea`/`createBrandAndIdea` actions the web form already calls, so
  dedupe/moderation logic is never duplicated.
- **Duplicate detection** (`src/lib/dedupe.ts`) uses a plain word-overlap
  heuristic, not embeddings. Swapping in pgvector + a real embedding model
  is a drop-in replacement for `similarity()` once that's wired up — the
  `Idea` model's schema comment notes where the vector column goes.
- **Idea moderation.** Ideas go live immediately; nothing yet catches
  disguised complaints before they publish (flagged as a launch blocker in
  the wish-list doc, not yet built).
- **Brand dashboard analytics/settings, monetization.** Not built; the
  freemium/pro-account direction is still being scoped in the wish-list doc.

## Deploying

```bash
vercel deploy --prod
```
No CI — this repo has no GitHub remote. Run `npx prisma generate` after any
schema change before restarting the dev server, or Next's dev server will
keep using the stale Prisma Client and throw "Unknown argument" errors on
the new fields.
