import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeRedirectPath } from "@/lib/auth/safe-path";
import { ensurePendingSubscription } from "@/lib/subscription/pending-plan";

function getSuccessRedirect(request: NextRequest, next: string, template: string | null) {
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = template ? "/dashboard/forms" : safeRedirectPath(next);
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
  const next = searchParams.get("next") ?? "/dashboard/forms";
  const template = searchParams.get("template");
  const plan = searchParams.get("plan");
  const cycle = searchParams.get("cycle");

  const supabase = await createClient();

  let authenticated = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      authenticated = true;
    }
  }

  if (!authenticated && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      authenticated = true;
      if (type === "recovery") {
        return getSuccessRedirect(request, "/auth/update-password", template);
      }
    }
  }

  if (authenticated) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && plan) {
      await ensurePendingSubscription(supabase, user.id, plan, cycle);
    }

    return getSuccessRedirect(request, next, template);
  }

  return getErrorRedirect(request);
}
