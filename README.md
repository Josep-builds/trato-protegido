# Trato Protegido

Transaction-locked P2P deal flow for WhatsApp Marketplace sellers: a seller creates a deal, a buyer passes a **simulated** identity check, funds move through a **simulated** escrow, and both sides confirm completion. See `docs/PACKET.md` for the product spec and `docs/DECISIONS.md` for build log/decisions.

Stack: Next.js (App Router) + Supabase (Auth + Postgres, RLS on every table) + Claude API (simulated vision check). No real payments, no real ID verification — see Scope Cut in `docs/PACKET.md`.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase + Anthropic keys
npm run dev
```

Run `supabase/migrations/0001_init.sql` once in the Supabase SQL editor before first use, and enable Google as an OAuth provider in Supabase Auth settings.
