import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInButton from "./sign-in-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

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
        <p className="text-xs text-zinc-400">
          Identity verification and escrow shown in this demo are simulated.
        </p>
      </div>
    </div>
  );
}
