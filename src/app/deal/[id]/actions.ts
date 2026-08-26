"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePhoto } from "@/lib/validation";

type VerifyResult = {
  ok: boolean;
  message: string;
};

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function extFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function verifyBuyer(formData: FormData): Promise<VerifyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const dealId = formData.get("deal_id");
  if (typeof dealId !== "string" || !dealId) {
    return { ok: false, message: "Missing deal." };
  }

  const idPhoto = formData.get("id_photo");
  const selfie = formData.get("selfie");
  if (!(idPhoto instanceof File) || !(selfie instanceof File)) {
    return { ok: false, message: "Both photos are required." };
  }

  const idError = validatePhoto(idPhoto, "ID photo");
  if (idError) return { ok: false, message: idError };
  const selfieError = validatePhoto(selfie, "Selfie");
  if (selfieError) return { ok: false, message: selfieError };
  if (!ALLOWED_MEDIA_TYPES.has(idPhoto.type) || !ALLOWED_MEDIA_TYPES.has(selfie.type)) {
    return { ok: false, message: "Photos must be JPEG, PNG, GIF, or WebP." };
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, buyer_id, status")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError || !deal) {
    return { ok: false, message: "Deal not found." };
  }
  if (deal.buyer_id !== user.id) {
    return { ok: false, message: "Only the buyer can complete verification." };
  }
  if (deal.status !== "pending") {
    return { ok: false, message: "This deal is not awaiting verification." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      message: "Verification is not configured on the server (missing API key).",
    };
  }

  const idBytes = new Uint8Array(await idPhoto.arrayBuffer());
  const selfieBytes = new Uint8Array(await selfie.arrayBuffer());

  const idPath = `${dealId}/id-${Date.now()}.${extFor(idPhoto.type)}`;
  const selfiePath = `${dealId}/selfie-${Date.now()}.${extFor(selfie.type)}`;

  const [idUpload, selfieUpload] = await Promise.all([
    supabase.storage.from("verifications").upload(idPath, idBytes, {
      contentType: idPhoto.type,
    }),
    supabase.storage.from("verifications").upload(selfiePath, selfieBytes, {
      contentType: selfie.type,
    }),
  ]);

  if (idUpload.error || selfieUpload.error) {
    return { ok: false, message: "Could not upload photos. Please try again." };
  }

  let result: "pass" | "fail" = "fail";
  let reason = "Could not complete the simulated check.";

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: idPhoto.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: Buffer.from(idBytes).toString("base64"),
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: selfie.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: Buffer.from(selfieBytes).toString("base64"),
              },
            },
            {
              type: "text",
              text: [
                "This is a SIMULATED, low-stakes demo identity check for a peer-to-peer",
                "marketplace escrow app — not a real KYC decision, and nothing here should",
                "be treated as verified identity or acted on outside this demo.",
                "The first image is a photo of an ID document; the second is a live selfie.",
                "Give a casual, lenient plausibility check: does the first image look like",
                "some kind of ID-like document (a photo, some text/layout), and does the",
                "second image look like a photo of a real person (not a cartoon, not",
                "obviously blank or broken)?",
                'Respond with ONLY a JSON object, no other text: {"result": "pass" or "fail", "reason": "one short sentence"}.',
              ].join(" "),
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;

    if (parsed && (parsed.result === "pass" || parsed.result === "fail")) {
      result = parsed.result;
      reason = typeof parsed.reason === "string" ? parsed.reason : reason;
    }
  } catch {
    result = "fail";
    reason = "Could not complete the simulated check. Please try again.";
  }

  const { error: insertError } = await supabase.from("verifications").insert({
    deal_id: dealId,
    buyer_id_photo_url: idPath,
    buyer_selfie_url: selfiePath,
    liveness_result: result,
    verified_at: new Date().toISOString(),
  });

  if (insertError) {
    return { ok: false, message: "Could not save the verification result." };
  }

  if (result === "pass") {
    await supabase.from("deals").update({ status: "buyer_verified" }).eq("id", dealId);
  }

  revalidatePath(`/deal/${dealId}`);

  return {
    ok: result === "pass",
    message: reason,
  };
}

export async function transferToEscrow(dealId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: deal } = await supabase
    .from("deals")
    .select("id, buyer_id, status")
    .eq("id", dealId)
    .maybeSingle();

  if (deal && deal.buyer_id === user.id && deal.status === "buyer_verified") {
    await supabase
      .from("escrow_status")
      .update({ status: "held", updated_at: new Date().toISOString() })
      .eq("deal_id", dealId);

    await supabase.from("deals").update({ status: "funds_held" }).eq("id", dealId);

    revalidatePath(`/deal/${dealId}`);
  }

  redirect(`/deal/${dealId}`);
}
