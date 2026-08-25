PACKET — Week 3 Build Slice
Role: Money · Vacuum: Proof-of-Human for Commerce (honoring Blueprint
Condition #4)
1. Problem (in my own words)
On WhatsApp Marketplace, a seller and a buyer close deals for used items (e.g. phones)
with zero verification layer. The buyer may be a fake profile or a real-but-scamming
counterpart (fake-overpayment script). Today, if something goes wrong, the seller
recovers about 10 centavos per peso claimed (Condusef), and 93% of cases never enter
the justice system. The platform (WhatsApp/Meta) takes no responsibility — the deal
happens outside any verified rail.
2. Exact user
An individual seller in Mexico City selling a used phone (ticket ~MX$5,000) on
WhatsApp Marketplace. Not a formal business — no margin to absorb a loss, no access
to lawyers.
3. Success definition
Before the module closes: a seller can create a deal, a buyer can pass a simulated
identity check (ID + liveness) locked to THAT specific deal, funds are held in simulated
escrow, and the seller can release shipment only after seeing “buyer verified + funds
held” on screen.
4. Mockup — Wireframe
Key screen: “Deal created → Waiting for buyer verification → Funds in escrow → Confirm
shipment.” HTML wireframe delivered as a separate artifact (temporary substitute for an
AI-image-generated mockup).
5. Flow — Mermaid Diagram (swimlane: Seller / Buyer /
System / AI)
flowchart TD
subgraph Seller
V1[Creates the deal: item + price MX$5,000]
V4[Sees status: Buyer verified + Funds in escrow]
V5[Confirms shipment]
V7[Confirms delivery received]
end
subgraph Buyer
C1[Receives deal link]
C2[Uploads ID photo + liveness selfie]
C3[Transfers funds to escrow]
C6[Confirms item received]
end
subgraph System
S1[Generates unique transaction-locked deal]
S3[Locks funds in simulated escrow]
S8[Releases funds to seller]
end
subgraph AI_Vision_API
S2[Verifies ID + liveness against the deal]
end
V1 --> S1 --> C1 --> C2 --> S2
S2 -- valid --> C3 --> S3 --> V4 --> V5 --> C6 --> S8
S2 -- invalid --> C2
6. Benchmark line
The best existing solution on Earth for this is: Turo verifies both sides (owner and
renter) before a high-value P2P vehicle transaction, with end-to-end platform-owned
verification. Mine differs / localizes because: Turo owns the entire transaction inside
its platform; my build sits as an external layer on top of a chat that has no owner
(WhatsApp/Marketplace), and ties verification to one specific deal rather than a static
profile — closing the gap that neither Turo nor Poshmark solve for Mexican informal
commerce.
7. Long-view (3 years)
If this slice works, the full product becomes a transactional trust layer that any informal
seller in Mexico can drop into a WhatsApp chat with a link, without needing Meta to
change its policy. In three years, this integrates with existing payment rails (SPEI,
fintechs) so escrow is real instead of simulated, and identity verification becomes cheap
enough (MX$20-80) to offer for free on transactions under MX$2,000, subsidized by a
fee on larger transactions — honoring Blueprint Condition #4 that verification never
becomes a privilege reserved for those who can pay.
8. Scope cut (NOT building this week)
No real payments integration (SPEI, Stripe, etc.) — escrow is simulated and labeled
on screen.
No real ID verification against INE/RENAPO — the vision API simulates validation
(labeled “Simulated verification”).
No dispute resolution between buyer and seller.
No full buyer app — only the minimal flow of upload photo + confirm.
No connection to Family Shield (the team’s primary vacuum) — this build honors only
Josep/Money’s declaration.
9. Architecture + Stack
Layer Tool Note
Frontend Next.js + Tailwind (Vercel) Free tier
Auth Supabase Auth (Google sign-in) Required by Security Floor
DB Supabase Postgres + RLS ON Each user sees only their own
deals
Identity
check
LLM + Vision API (Claude/GPT
vision) SIMULATED, labeled on screen
Escrow escrow_status table in Supabase SIMULATED, labeled on screen
Deploy Vercel Minimum 2 deploys
10. Test plan
Mechanical pass:
1. Create deal as seller → verify it shows status “pending”.
2. Upload invalid photo (blurry/incomplete) as buyer → must reject and ask to retry.
3. Upload valid photo → status changes to “buyer verified”.
4. Simulate transfer to escrow → status changes to “funds held”.
5. Seller confirms shipment → status changes to “shipped”.
6. Buyer confirms receipt → funds released (simulated) → status “completed”.
7. Try to access another user’s deal (RLS) → must block.
Expected bug to find and document: what happens if the buyer never uploads a
photo (the deal should expire or show a clear status, not hang with no feedback).
Persona test pass: see PERSONA
_Dulce.pdf — uses a persona built from User
research (e.g. a first-time seller distrustful of uploading their ID to an unknown link)
