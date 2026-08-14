# halfAccessible portal

Internal HR portal. Gen Z vibe, open culture, no corporate BS.

## Stack

Next.js 15 (App Router) · Tailwind v4 · SCSS modules · Supabase · TOTP auth · Vercel

## Auth

No passwords. No magic links.

1. **Signup:** enter email → scan the QR in Authy / Google Authenticator / 1Password → type the first 6-digit code.
2. **Login:** enter email → type the current authenticator code.

If someone loses their authenticator, an admin hits **reset authenticator** on `/users`.

`TOTP_ENCRYPTION_KEY` must be 32 bytes written as 64 hex characters. In-memory rate limits reset per serverless instance (fine for v1).

## Local setup

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, TOTP_ENCRYPTION_KEY, CRON_SECRET

npx supabase start   # needs Docker; skip if you already have a hosted project
npx supabase db reset
npm install
npm run dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup).

## Scripts

- `npm run dev` - Next.js
- `npm test` - Vitest
- `npm run e2e` - Playwright (starts the dev server)
- `npm run build` - production build

## Cron

Vercel cron (see `vercel.json`):

- `/api/cron/resolve-burgers` once a day at 03:00 UTC
- `/api/cron/expire-anon` once a day at 03:00 UTC

Send `Authorization: Bearer $CRON_SECRET`.

## Design

Written source of truth: [`docs/DESIGN.md`](docs/DESIGN.md). Visual reference: `Gen Z Portal Design/halfAccessible Portal v2.dc.html`.
