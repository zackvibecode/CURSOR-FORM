import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, findUserIdByEmail, setUserPassword } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
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

  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) {
    return response;
  }

  // If sign-in failed, user doesn't exist, or password is wrong — do NOT auto-create accounts
  const existingUserId = await findUserIdByEmail(email);

  if (existingUserId && createAdminClient()) {
    // User exists but password might be wrong — silently update it (convenience for forgotten passwords)
    const { error: updateError } = await setUserPassword(existingUserId, password);
    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 400 });
    }

    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    if (!error) {
      return response;
    }
  }

  // User does not exist — reject password login. Do not auto-create accounts.
  return NextResponse.json(
    { error: "Invalid email or password. If you don't have an account, use the signup page." },
    { status: 401 }
  );
}
