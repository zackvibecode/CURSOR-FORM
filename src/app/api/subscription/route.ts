import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no subscription row, create a free one
  if (!subscription) {
    const { data: newSub, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan: "free",
        status: "active",
        billing_cycle: "monthly",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: newSub });
  }

  return NextResponse.json({ subscription });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { plan, billing_cycle } = body as {
    plan?: string;
    billing_cycle?: string;
  };

  // Validate plan
  const validPlans = ["free", "pro", "business"];
  if (!plan || !validPlans.includes(plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be free, pro, or business." },
      { status: 400 }
    );
  }

  // Get current subscription
  const { data: current, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const now = new Date();
  const validCycles = ["monthly", "yearly"];
  const cycle =
    billing_cycle && validCycles.includes(billing_cycle)
      ? billing_cycle
      : current?.billing_cycle || "monthly";

  if (plan === "free") {
    // Downgrade to free — set immediately
    if (!current) {
      // Create free subscription
      const { data: newSub, error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: "free",
          status: "active",
          billing_cycle: "monthly",
          started_at: now.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ subscription: newSub });
    }

    const { data: updated, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: "free",
        status: "active",
        billing_cycle: "monthly",
        started_at: now.toISOString(),
        expires_at: null,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: updated, message: "Plan downgraded to free." });
  }

  // For paid plans: set status to pending (admin must approve)
  if (current?.plan === plan && current?.status === "active") {
    return NextResponse.json(
      { error: `You are already on the ${plan} plan.` },
      { status: 409 }
    );
  }

  const { data: result, error: upsertError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan,
        status: "pending",
        billing_cycle: cycle,
        started_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    subscription: result,
    message: `Your ${plan} plan request has been submitted for approval.`,
  });
}