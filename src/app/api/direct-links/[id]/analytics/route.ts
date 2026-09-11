import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

/**
 * GET /api/direct-links/[id]/analytics?days=30
 * Returns click totals, per-sales breakdown, daily series, and recent clicks.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dl } = await supabase
    .from("direct_links")
    .select("id, name, total_clicks, total_redirects, distribution_mode")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!dl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 30), 1), 90);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data: clicks, error } = await supabase
    .from("direct_link_clicks")
    .select(
      "id, assigned_member_id, assigned_name, assigned_phone, redirect_status, is_bot, utm_source, utm_campaign, referrer, clicked_at"
    )
    .eq("direct_link_id", id)
    .gte("clicked_at", since.toISOString())
    .order("clicked_at", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = clicks ?? [];
  const real = rows.filter((c) => !c.is_bot && c.redirect_status === "ok");
  const bots = rows.filter((c) => c.is_bot).length;
  const failed = rows.filter((c) => !c.is_bot && c.redirect_status !== "ok").length;

  // Per team sales member
  const byMemberMap = new Map<
    string,
    { member_id: string | null; name: string; phone: string | null; clicks: number }
  >();

  for (const c of real) {
    const key = c.assigned_member_id || c.assigned_name || "unassigned";
    const existing = byMemberMap.get(key);
    if (existing) {
      existing.clicks += 1;
    } else {
      byMemberMap.set(key, {
        member_id: c.assigned_member_id,
        name: c.assigned_name?.trim() || "Unassigned",
        phone: c.assigned_phone,
        clicks: 1,
      });
    }
  }

  const by_member = Array.from(byMemberMap.values()).sort((a, b) => b.clicks - a.clicks);
  const realTotal = real.length;

  // Daily series (oldest → newest)
  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const dayCounts = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  for (const c of real) {
    const key = c.clicked_at.slice(0, 10);
    if (key in dayCounts) dayCounts[key] += 1;
  }
  const daily = dayKeys.map((date) => ({ date, clicks: dayCounts[date] }));

  // Recent clicks (last 50 real)
  const recent = real.slice(0, 50).map((c) => ({
    id: c.id,
    assigned_name: c.assigned_name,
    assigned_phone: c.assigned_phone,
    utm_source: c.utm_source,
    utm_campaign: c.utm_campaign,
    referrer: c.referrer,
    clicked_at: c.clicked_at,
  }));

  return NextResponse.json({
    summary: {
      total_clicks: dl.total_clicks ?? 0,
      total_redirects: dl.total_redirects ?? 0,
      period_clicks: realTotal,
      period_bots: bots,
      period_failed: failed,
      days,
      distribution_mode: dl.distribution_mode,
    },
    by_member: by_member.map((m) => ({
      ...m,
      percent: realTotal > 0 ? Math.round((m.clicks / realTotal) * 1000) / 10 : 0,
    })),
    daily,
    recent,
  });
}
