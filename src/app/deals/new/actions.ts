"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dealInputSchema } from "@/lib/validation";

export async function createDeal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const parsed = dealInputSchema.safeParse({
    item_name: formData.get("item_name"),
    item_price: formData.get("item_price"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/deals/new?error=${encodeURIComponent(message)}`);
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      seller_id: user.id,
      item_name: parsed.data.item_name,
      item_price: parsed.data.item_price,
    })
    .select("id")
    .single();

  if (error || !deal) {
    redirect(
      `/deals/new?error=${encodeURIComponent("Could not create the deal. Please try again.")}`,
    );
  }

  redirect(`/deal/${deal.id}`);
}
