import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: max 5 signup attempts per IP per minute (abuse guard).
  const ip = ipFromRequest(request);
  const limit = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const plan = typeof body.plan === "string" ? body.plan : "";
  const cycle = typeof body.cycle === "string" ? body.cycle : "monthly";

  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: "Email and password (min 6 characters) are required." },
      { status: 400 }
    );
  }

  let response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", "/dashboard/forms");

  // Create the account as already-confirmed using the service role key.
  // This bypasses the "Error sending confirmation email" issue when SMTP
  // is not configured in Supabase.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let userId: string | null = null;

  if (serviceKey) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const alreadyExists = /already.*registered|already.*exist/i.test(
        createError.message
      );
      return NextResponse.json(
        {
          error: alreadyExists
            ? "This email is already registered. Please log in instead."
            : createError.message,
        },
        { status: 400 }
      );
    }

    userId = created.user?.id ?? null;

    // Sign in to set the session cookies on the response
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }
  } else {
    // Fallback: standard signup (requires email confirmation to be OFF)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    userId = data.user?.id ?? null;

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        return NextResponse.json({
          ok: true,
          message:
            "Account created! Check your email and click the confirmation link, then log in.",
        });
      }
    }
  }

  // If a paid plan was selected, create a pending subscription request
  const validPaidPlans = ["pro", "business"];
  if (userId && validPaidPlans.includes(plan)) {
    const validCycle = cycle === "yearly" ? "yearly" : "monthly";
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status: "pending",
        billing_cycle: validCycle,
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  return response;
}