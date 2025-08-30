# Venue Booking MVP (Vercel-ready, no Docker/Redis)

This is a deployable Next.js App Router project that includes both frontend and backend (API routes) for a simple venue search and booking flow.

Key choices:
- Single app for easy Vercel deploy. API routes serve as backend.
- PostgreSQL via Neon (@neondatabase/serverless). If `DATABASE_URL` is not set, the API falls back to mock data so deployment never fails.
- React Query for data/state, Tailwind for UI, basic security headers, lightweight rate limiting.

## Quick Start

- Deploy to Vercel
- Optionally set env vars:
  - `DATABASE_URL` (Neon/Vercel Postgres style URL)
  - `JWT_SECRET` (for optional JWT verification)

Locally:
- `NEXT_PUBLIC_API_URL` defaults to `/api`
- Run `pnpm dev` (or yarn/npm) if using standard Next dev locally.

## Endpoints

- GET `/api/venues/:id` -> venue details + halls + mock availability
- POST `/api/venues/:id/check-availability` -> check for conflicts
- POST `/api/bookings` -> create booking (inserts if DB, else returns mock confirmation)

All request bodies validated with zod, and basic rate limit applied.

## Database

SQL scripts in `/scripts/sql`:
- `001_schema.sql` creates tables: venues, halls, bookings, venue_images
- `002_seed.sql` adds sample venue/halls/images

When `DATABASE_URL` is set, API will use DB; otherwise it returns mock data.

## Security

- Security headers via middleware
- Basic rate limiting (in-memory)
- Optional JWT verification via `Authorization: Bearer <token>` (non-blocking)

## UI

- `/venues/[id]` shows:
  - Gallery (3 images)
  - Hall selector
  - Availability grid (14 days)
  - Booking modal with multi-step form and validation

## Assumptions

- Existing auth is external; token (if present) is verified but not required.
- Redis, Docker, LocalStack omitted per request.
- For production rate limiting and auth, consider a durable store.
