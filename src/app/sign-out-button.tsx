"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="text-sm text-zinc-500 hover:text-zinc-800 hover:underline"
    >
      Sign out
    </button>
  );
}
