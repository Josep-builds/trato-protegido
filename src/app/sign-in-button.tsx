"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignInButton({ next }: { next?: string }) {
  const supabase = createClient();

  async function signIn() {
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
  }

  return (
    <button
      onClick={signIn}
      className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
    >
      Sign in with Google
    </button>
  );
}
