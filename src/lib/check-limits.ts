import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getPlanLimits, type PlanName } from "@/lib/plan-limits";

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  max: number;
  plan: PlanName;
}

async function getUserPlan(userId: string): Promise<PlanName> {
  const supabase = await createSupabaseClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .single();

  if (!subscription || subscription.status !== "active") {
    return "free";
  }

  return subscription.plan as PlanName;
}

export async function checkFormLimit(userId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  const supabase = await createSupabaseClient();

  const { count, error } = await supabase
    .from("forms")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    return { allowed: false, remaining: 0, max: limits.maxForms, plan };
  }

  const currentCount = count ?? 0;
  const max = limits.maxForms;
  const remaining = max === Infinity ? Infinity : Math.max(0, max - currentCount);

  return {
    allowed: remaining > 0 || max === Infinity,
    remaining,
    max,
    plan,
  };
}

export async function checkSubmissionLimit(formId: string): Promise<LimitCheckResult> {
  const supabase = await createSupabaseClient();

  // Get the form owner's user_id
  const { data: form } = await supabase
    .from("forms")
    .select("user_id")
    .eq("id", formId)
    .single();

  if (!form) {
    return { allowed: false, remaining: 0, max: 0, plan: "free" };
  }

  const plan = await getUserPlan(form.user_id);
  const limits = getPlanLimits(plan);

  if (limits.maxSubmissionsPerMonth === Infinity) {
    return { allowed: true, remaining: Infinity, max: Infinity, plan };
  }

  // Count this month's submissions for this form
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("form_id", formId)
    .gte("submitted_at", firstDayOfMonth);

  if (error) {
    return { allowed: false, remaining: 0, max: limits.maxSubmissionsPerMonth, plan };
  }

  const currentCount = count ?? 0;
  const max = limits.maxSubmissionsPerMonth;
  const remaining = Math.max(0, max - currentCount);

  return {
    allowed: currentCount < max,
    remaining,
    max,
    plan,
  };
}