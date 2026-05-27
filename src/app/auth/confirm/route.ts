import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function getSuccessRedirect(request: NextRequest, next: string, template: string | null) {
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = template ? "/dashboard" : next.startsWith("/") ? next : "/dashboard";
  redirectTo.search = template ? `template=${template}` : "";
  return NextResponse.redirect(redirectTo);
}

function getErrorRedirect(request: NextRequest) {
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/login";
  redirectTo.search = "error=auth";
  return NextResponse.redirect(redirectTo);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const template = searchParams.get("template");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return getSuccessRedirect(request, next, template);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return getSuccessRedirect(request, next, template);
    }
  }

  return getErrorRedirect(request);
}
