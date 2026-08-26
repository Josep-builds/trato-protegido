# DECISIONS

Build log for the Week 3 slice. Newest entries first.

## 2026-08-26 — Week 3 slice built end-to-end

**What was decided:**

- **Stack**: Next.js App Router + Supabase (Auth + Postgres, RLS) + Claude API (`claude-opus-5`) for the simulated vision check. Server Actions for every mutation (including file upload) instead of API routes — simpler, and `ANTHROPIC_API_KEY` never leaves the server.
- **Buyer auth**: buyer signs in with Google too (not an anonymous share link), per the spec's own "simpler for RLS" recommendation. This keeps every table's RLS policy down to `seller_id = auth.uid() OR buyer_id = auth.uid()` with no anon-readable rows anywhere.
- **The share-link chicken-and-egg problem**: a buyer opening a fresh link has `buyer_id IS NULL`, so no RLS policy would ever let them read the deal to claim it — and a policy that let anyone read unclaimed rows would fail the "can't browse other users' deals" requirement. Solved with a single `SECURITY DEFINER` Postgres function, `claim_deal(p_deal_id)`, that atomically sets `buyer_id` the first time an eligible buyer calls it. It's the only privileged escape hatch in the schema; everything else goes through the normal RLS-scoped client. No service-role key is used anywhere in the app.
- **Escrow row lifecycle**: an `AFTER INSERT` trigger on `deals` creates the matching `escrow_status` row automatically (amount = item_price, status = 'none'), so the app never inserts it directly and it can't drift out of sync with the deal.
- **Immutability**: a `BEFORE UPDATE` trigger blocks changes to `item_name`, `item_price`, and `seller_id` after a deal is created.
- **Verification photos**: stored in a private Supabase Storage bucket (`verifications`), path-scoped by `<deal_id>/...`, with storage RLS policies mirroring the table policies (upload restricted to that deal's buyer, read restricted to that deal's buyer or seller).

**Bug found during the mechanical test pass (before any UI testing):** the SQL migration, when first run in the Supabase SQL editor, left the `authenticated` role without base table GRANTs (separate from RLS policies — Postgres checks table-level ACL before it ever evaluates row policies) and the `verifications` storage bucket never got created, because the SQL editor doesn't roll back earlier statements when a later one fails. Confirmed via direct REST calls against the live project (not just re-reading the SQL). Fixed by adding explicit `GRANT` statements and making the bucket insert idempotent (`ON CONFLICT DO NOTHING`) in `supabase/migrations/0001_init.sql`, and had the user re-run a small idempotent fix-up snippet against the already-partially-applied project.

**What's next:**

- Full end-to-end click-through with two real Google accounts (seller + buyer) — in progress by the user; see the checklist handed off alongside this note.
- Manual RLS spot-check: confirm a signed-in user genuinely cannot read another user's `deals` row via a direct REST call with their own JWT (the anon-key checks done during build only proved anon is correctly denied — proving the `authenticated` grant is scoped correctly needs a real session).
- Out of scope for this slice (see `docs/PACKET.md` § Scope Cut): real payments, real ID verification, dispute resolution, a full standalone buyer app.
