import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createDeal } from "./actions";

export default async function NewDealPage(props: PageProps<"/deals/new">) {
  await requireUser();
  const { error } = await props.searchParams;

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">Create a deal</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Enter the item and price. You&rsquo;ll get a shareable link to send the buyer.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}

      <form action={createDeal} className="mt-6 space-y-4">
        <div>
          <label htmlFor="item_name" className="block text-sm font-medium text-zinc-700">
            Item name
          </label>
          <input
            id="item_name"
            name="item_name"
            type="text"
            required
            maxLength={100}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="iPhone 12, 128GB"
          />
        </div>
        <div>
          <label htmlFor="item_price" className="block text-sm font-medium text-zinc-700">
            Price (MXN)
          </label>
          <input
            id="item_price"
            name="item_price"
            type="number"
            required
            min="0.01"
            max="1000000"
            step="0.01"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="5000"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Create deal
        </button>
      </form>
    </div>
  );
}
