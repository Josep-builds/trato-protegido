import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Every authed page calls this first — "no page accessible without auth"
 * enforced at the page level, on top of RLS at the database level.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return { supabase, user };
}
