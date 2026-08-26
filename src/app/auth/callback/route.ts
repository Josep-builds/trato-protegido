import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // OAuth2 convention: on failure, the provider/Supabase sends `error` +
  // `error_description` instead of `code` — surface those verbatim so a
  // failed exchange is diagnosable instead of collapsing into "no code".
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(
        `${oauthError}: ${oauthErrorDescription ?? "(no description)"}`,
      )}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/?error=${encodeURIComponent(
      `No code or error param present. Raw query: ${searchParams.toString() || "(empty)"}`,
    )}`,
  );
}
