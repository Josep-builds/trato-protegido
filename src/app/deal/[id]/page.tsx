import Link from "next/link";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { STATUS_LABEL, STATUS_TIMELINE } from "@/lib/deal-status";
import type { Deal, EscrowStatus, Verification } from "@/lib/types";
import SignOutButton from "../../sign-out-button";
import SimulatedBadge from "../../simulated-badge";
import VerifyForm from "./verify-form";
import { transferToEscrow } from "./actions";

async function shareUrlFor(dealId: string) {
  const host = (await headers()).get("host");
  if (!host) return `/deal/${dealId}`;
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}/deal/${dealId}`;
}

export default async function DealPage(props: PageProps<"/deal/[id]">) {
  const { id } = await props.params;
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let deal = existing as Deal | null;

  if (!deal) {
    const { data: claimed, error: claimError } = await supabase.rpc("claim_deal", {
      p_deal_id: id,
    });

    if (claimError || !claimed) {
      return (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Deal not available</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This deal doesn&rsquo;t exist, has already been claimed by another buyer,
            or you don&rsquo;t have access to it.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm text-zinc-500 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      );
    }

    deal = claimed as Deal;
  }

  const isSeller = deal.seller_id === user.id;

  const [{ data: verification }, { data: escrow }] = (await Promise.all([
    supabase
      .from("verifications")
      .select("*")
      .eq("deal_id", id)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("escrow_status").select("*").eq("deal_id", id).maybeSingle(),
  ])) as [{ data: Verification | null }, { data: EscrowStatus | null }];

  const currentIndex = STATUS_TIMELINE.indexOf(deal.status);
  const shareUrl = await shareUrlFor(deal.id);

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
          ← Dashboard
        </Link>
        <SignOutButton />
      </div>

      <h1 className="mt-4 text-xl font-semibold text-zinc-900">{deal.item_name}</h1>
      <p className="text-zinc-600">{formatPrice(deal.item_price)}</p>

      <ol className="mt-6 space-y-2">
        {STATUS_TIMELINE.map((status, i) => (
          <li
            key={status}
            className={`flex items-center gap-2 text-sm ${
              i <= currentIndex ? "font-medium text-zinc-900" : "text-zinc-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                i <= currentIndex ? "bg-green-500" : "bg-zinc-300"
              }`}
            />
            {STATUS_LABEL[status]}
          </li>
        ))}
      </ol>

      {verification && (
        <div className="mt-6 flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Identity check: {verification.liveness_result === "pass" ? "Passed" : "Failed"}
            </p>
          </div>
          <SimulatedBadge label="Identity check" />
        </div>
      )}

      {escrow && escrow.status !== "none" && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">
            Escrow: {formatPrice(escrow.amount)} — {escrow.status === "held" ? "Held" : "Released"}
          </p>
          <SimulatedBadge label="Escrow" />
        </div>
      )}

      <div className="mt-6">
        {isSeller ? (
          <div className="space-y-3">
            {deal.status === "pending" && (
              <div className="rounded-md border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-900">Share this link with the buyer</p>
                <p className="mt-2 break-all rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  {shareUrl}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Waiting for the buyer to open the link and complete verification.
                </p>
              </div>
            )}
            {deal.status === "buyer_verified" && (
              <p className="text-sm text-zinc-600">
                Buyer verified. Waiting for the buyer to transfer funds to escrow.
              </p>
            )}
            {deal.status === "funds_held" && (
              <p className="text-sm text-zinc-600">
                Funds are held in escrow. Shipment confirmation is available in the next step.
              </p>
            )}
            {deal.status === "shipped" && (
              <p className="text-sm text-zinc-600">Waiting for the buyer to confirm receipt.</p>
            )}
            {deal.status === "completed" && (
              <p className="text-sm text-green-700">Deal completed.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {deal.status === "pending" && <VerifyForm dealId={deal.id} />}
            {deal.status === "buyer_verified" && (
              <div className="space-y-2 rounded-md border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">
                    Transfer {formatPrice(deal.item_price)} to escrow
                  </p>
                  <SimulatedBadge label="Escrow transfer" />
                </div>
                <form action={transferToEscrow.bind(null, deal.id)}>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    Transfer to escrow
                  </button>
                </form>
              </div>
            )}
            {deal.status === "funds_held" && (
              <p className="text-sm text-zinc-600">
                Funds are in escrow. Waiting for the seller to ship the item.
              </p>
            )}
            {deal.status === "shipped" && (
              <p className="text-sm text-zinc-600">
                Item marked as shipped. Confirming receipt is available in the next step.
              </p>
            )}
            {deal.status === "completed" && (
              <p className="text-sm text-green-700">Deal completed.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
