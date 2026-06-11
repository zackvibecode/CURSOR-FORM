import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_PAID_PLANS = ["pro", "business"] as const;

export async function ensurePendingSubscription(
  supabase: SupabaseClient,
  userId: string,
  plan: string | null,
  cycle: string | null
): Promise<void> {
  if (!plan || !VALID_PAID_PLANS.includes(plan as (typeof VALID_PAID_PLANS)[number])) {
    return;
  }

  const validCycle = cycle === "yearly" ? "yearly" : "monthly";

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.status === "active" && existing.plan !== "free") {
    return;
  }

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
