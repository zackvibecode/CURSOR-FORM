import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { buildSeries, isRealClick } from "@/lib/overview-stats";

type Params = { params: { id: string } };

interface ClickRow {
  id: string;
  assigned_member_id: string | null;
  assigned_name: string | null;
  assigned_phone: string | null;
  redirect_status: string;
  is_bot: boolean;
  utm_source: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  clicked_at: string;
}

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

  // Paginated: `.limit(2000)` would be silently capped at PostgREST's 1000-row
  // max, so the per-member breakdown and period total stayed stuck at the newest
  // 1000 clicks. Walk pages instead so every click in the range is counted.
  let rows: ClickRow[];
  try {
    rows = await fetchAllRows<ClickRow>((from, to) =>
      supabase
        .from("direct_link_clicks")
        .select(
          "id, assigned_member_id, assigned_name, assigned_phone, redirect_status, is_bot, utm_source, utm_campaign, referrer, clicked_at"
        )
        .eq("direct_link_id", id)
        .gte("clicked_at", since.toISOString())
        .order("clicked_at", { ascending: false })
        .range(from, to)
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load clicks" },
      { status: 500 }
    );
  }

  const real = rows.filter(isRealClick);
  const bots = rows.filter((c) => c.is_bot).length;
  const failed = rows.filter((c) => !c.is_bot && c.redirect_status !== "ok").length;

  // Exact all-time count of real redirects. The denormalised `total_clicks`
  // counter can drift from the click rows, which made the "All-time clicks"
  // card disagree with the per-member breakdown below it.
  const { count: allTimeReal } = await supabase
    .from("direct_link_clicks")
    .select("*", { count: "exact", head: true })
    .eq("direct_link_id", id)
    .eq("is_bot", false)
    .eq("redirect_status", "ok");

  // Per team sales member — group by phone (stable), not member UUID.
  // Re-saving the team creates new member rows, so old clicks keep old IDs
  // and would otherwise show as duplicate names.
  const byMemberMap = new Map<
    string,
    { member_id: string | null; name: string; phone: string | null; clicks: number }
  >();

  const memberKey = (c: {
    assigned_member_id: string | null;
    assigned_name: string | null;
    assigned_phone: string | null;
  }) => {
    const phone = (c.assigned_phone || "").replace(/\D/g, "");
    if (phone) return `phone:${phone}`;
    const name = (c.assigned_name || "").trim().toLowerCase();
    if (name) return `name:${name}`;
    return "unassigned";
  };

  for (const c of real) {
    const key = memberKey(c);
    const existing = byMemberMap.get(key);
    if (existing) {
      existing.clicks += 1;
      // Prefer non-empty latest name/phone/id
      if (c.assigned_name?.trim()) existing.name = c.assigned_name.trim();
      if (c.assigned_phone) existing.phone = c.assigned_phone;
      if (c.assigned_member_id) existing.member_id = c.assigned_member_id;
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

  // Daily series (oldest → newest) — shared UTC bucketing so Overview and
  // Direct Link Reports always agree on per-day counts.
  const daily = buildSeries(
    real.map((c) => c.clicked_at),
    days
  ).map((point) => ({ date: point.date, clicks: point.value }));

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
      total_clicks: allTimeReal ?? dl.total_clicks ?? 0,
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
