# Hotel Transylvania

Booking website and back office for a 26-room boutique castle hotel in the Carpathian foothills of Brasov County, Romania. Guests search live availability, pay online through Stripe, and get an instant confirmation email. Staff run the whole property from the admin dashboard: reservations on a tape chart, rooms and seasonal rates, housekeeping, guest profiles, review moderation, revenue reports and site content.

## Stack

- Next.js 14 (App Router) with TypeScript, server components and server actions
- PostgreSQL with Prisma ORM
- NextAuth (credentials, JWT sessions) for staff auth with four roles
- Stripe Payment Intents with webhook confirmation
- Resend for transactional email (falls back to console logging without an API key)
- Tailwind CSS, Radix primitives, Framer Motion, Recharts
- Deployable to AWS (Amplify Hosting or ECS behind an ALB, with RDS Postgres)

## What is inside

Public site: home, rooms and suites with live nightly pricing, amenities, dining, gallery with lightbox, offers and packages, events and weddings inquiry, about, contact, policies, privacy, and a four-step booking flow (search, room and add-ons, guest details, Stripe payment) ending in a confirmation page and email with a booking reference.

Back office at `/admin`: overview with today's arrivals and departures and one-click check-in and check-out, reservations with a 14-night tape chart plus filters and manual bookings for phone and walk-in guests, room and rate management with seasonal rules and an availability calendar, guest profiles with staff notes and stay history, a housekeeping board by floor with a task list, review moderation with homepage featuring, occupancy, ADR and RevPAR reports with CSV export, content management for packages and the gallery, and property settings (VAT rate, house times, policy text).

## Getting started

You need Node 18+, PostgreSQL 14+, and a Stripe account in test mode.

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill it in:

```bash
cp .env.example .env
```

At minimum set `DATABASE_URL`, `NEXTAUTH_SECRET` (any long random string), and your Stripe test keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). Leave `RESEND_API_KEY` empty to have emails print to the terminal instead of sending.

3. Create the schema and load the sample property:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

4. Forward Stripe webhooks to your local server (separate terminal):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in `.env`, then restart the dev server if it was already running.

5. Run it:

```bash
npm run dev
```

The site is at http://localhost:3000 and the back office at http://localhost:3000/admin.

### Test a full booking

Search dates from the homepage, pick a room, add breakfast, and pay with Stripe's test card `4242 4242 4242 4242` (any future expiry, any CVC). You should see the confirmation page with a reference like `HT-3F7K2M`, a confirmation email in the terminal, and the booking sitting in Reservations and in Reports.

### Seeded staff logins

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@hoteltransylvania.ro | owner-castle-1867 |
| Manager | manager@hoteltransylvania.ro | manager-castle-1867 |
| Front desk | frontdesk@hoteltransylvania.ro | frontdesk-castle-1867 |
| Housekeeping | housekeeping@hoteltransylvania.ro | housekeeping-castle-1867 |

Front desk sees reservations, guests and housekeeping but not rates, reports or settings. Housekeeping sees only the overview and the housekeeping board. Change these passwords before any real deployment.

## How the important parts work

**Inventory.** Guests book a room type (Forest Room); the property owns physical units of that type (rooms 111 to 114 and 211 to 214). Availability for a date range is units minus overlapping confirmed or in-house bookings, minus fresh unpaid holds, minus blocked units. A `RoomBlock` takes one physical room off sale for a date range, for repairs or owner use.

**Overbooking prevention.** Booking creation runs inside a database transaction that takes a row lock on the room type (`SELECT ... FOR UPDATE`), re-counts availability, and only then inserts. Two guests racing for the last room cannot both win.

**Payment flow.** Checkout re-prices the stay server side (client totals are never trusted), creates a `PENDING` booking and a Stripe Payment Intent carrying the booking reference. The webhook confirms the booking on `payment_intent.succeeded`, sends the guest and staff emails, and is idempotent, so Stripe retries are harmless. A `PENDING` booking holds inventory for 30 minutes; if payment never lands, the hold simply expires out of the availability count with no cron needed. The confirmation page also verifies the payment directly with Stripe, so it works even before the webhook arrives in local development.

**Pricing.** Every room type has a base nightly rate. `RateRule` rows adjust it per date range, either as a percent of base (125 = base plus 25 percent) or a fixed nightly amount, with priorities; a rule scoped to one room type beats a global rule on ties. Add-ons price per booking, per night, per guest, or per guest per night. VAT comes from the settings table and defaults to 9 percent for lodging.

**Reports.** Occupancy, ADR and RevPAR are computed from stored per-night rates, prorated so only nights inside the report range count. Booked value groups full booking totals by arrival date. The CSV export is role-gated to owner and manager.

**Rate limiting** on login, checkout and the public forms is in-memory, which is correct for a single server. Behind a load balancer, swap the store in `src/lib/rate-limit.ts` for Redis or ElastiCache; the function signature is designed for it.

**Rendering.** The public site and admin both render dynamically (`force-dynamic`) because prices, availability and content are live data. If traffic grows, the mostly-static pages (about, dining, amenities) are one-line candidates for ISR.

## Photography

All images are Unsplash placeholders, served under the Unsplash License and centralized in `src/lib/images.ts`. Every page and every seeded database row resolves through that one file, so switching to the property's real photography means uploading to S3 or any host, replacing the URLs in that file, updating `remotePatterns` in `next.config.mjs`, and re-running the seed.

## Deploying to AWS

The straightforward path is AWS Amplify Hosting, which understands Next.js App Router natively:

1. Create an RDS PostgreSQL instance (db.t4g.micro is fine to start) and run `npx prisma migrate deploy` against it, then the seed if you want the sample property.
2. Connect the repository to Amplify Hosting and set every variable from `.env.example` in the Amplify environment, with `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` pointing at your domain.
3. Add a webhook endpoint in the Stripe dashboard for `https://yourdomain.com/api/webhooks/stripe` with the `payment_intent.succeeded` and `payment_intent.canceled` events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Verify a sending domain in Resend and set `RESEND_API_KEY` and `EMAIL_FROM`.

For more control, the same container runs on ECS Fargate behind an Application Load Balancer: build with the standard Next.js Dockerfile, point it at the same RDS instance, and terminate TLS at the ALB. Real photography belongs in S3 behind CloudFront.

## Environment variables

See `.env.example` for the full list with comments: database URL, NextAuth URL and secret, site URL, the three Stripe keys, and the Resend key and from-address.

## A note on the name

Hotel Transylvania is also the title of a film franchise. Before using this name commercially for a real property, have a trademark search done for your jurisdiction.
