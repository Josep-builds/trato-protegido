import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/deal-status";
import { formatPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";
import SignOutButton from "../sign-out-button";

function DealRow({ deal }: { deal: Deal }) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm hover:border-zinc-400"
    >
      <div>
        <p className="font-medium text-zinc-900">{deal.item_name}</p>
        <p className="text-zinc-500">{formatPrice(deal.item_price)}</p>
      </div>
      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
        {STATUS_LABEL[deal.status]}
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const [{ data: selling }, { data: buying }] = await Promise.all([
    supabase
      .from("deals")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Your deals</h1>
        <SignOutButton />
      </div>

      <Link
        href="/deals/new"
        className="mt-6 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        + Create deal
      </Link>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Selling
        </h2>
        <div className="mt-3 space-y-2">
          {selling && selling.length > 0 ? (
            selling.map((deal) => <DealRow key={deal.id} deal={deal} />)
          ) : (
            <p className="text-sm text-zinc-500">No deals yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Buying
        </h2>
        <div className="mt-3 space-y-2">
          {buying && buying.length > 0 ? (
            buying.map((deal) => <DealRow key={deal.id} deal={deal} />)
          ) : (
            <p className="text-sm text-zinc-500">
              No deals yet — open a link a seller shared with you to get started.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
