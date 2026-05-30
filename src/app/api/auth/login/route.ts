import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: max 10 login attempts per IP per minute (brute-force guard).
  const ip = ipFromRequest(request);
  const limit = rateLimit(`login:${ip}`, 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

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
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) {
    return response;
  }

  // SECURITY: Never reset a password just because someone typed the wrong one.
  // The previous code here silently overwrote the account password with
  // whatever was submitted (via the service role key) and logged the attacker
  // in — an account-takeover hole. A wrong password must simply be rejected.
  // Forgotten passwords are handled by the proper reset-password flow instead.
  return NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 }
  );
}
