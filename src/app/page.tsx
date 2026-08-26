import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "./sign-in-button";

export default async function Home(props: PageProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error } = await props.searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Trato Protegido</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Create a transaction-locked deal, verify the buyer, and hold
            funds in escrow — for used-item sales on WhatsApp Marketplace.
          </p>
        </div>
        <SignInButton />
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            Sign-in failed: {Array.isArray(error) ? error[0] : error}
          </p>
        )}
        <p className="text-xs text-zinc-400">
          Identity verification and escrow shown in this demo are simulated.
        </p>
      </div>
    </div>
  );
}
