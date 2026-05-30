export type PlanName = "free" | "pro" | "business";

export interface PlanLimits {
  maxForms: number;
  maxSubmissionsPerMonth: number;
  label: string;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    maxForms: 3,
    maxSubmissionsPerMonth: 100,
    label: "Free",
  },
  pro: {
    maxForms: Infinity,
    maxSubmissionsPerMonth: 5000,
    label: "Pro",
  },
  business: {
    maxForms: Infinity,
    maxSubmissionsPerMonth: Infinity,
    label: "Business",
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free;
}