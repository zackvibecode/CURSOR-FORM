import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { TeamLeaderboard } from "@/components/dashboard/TeamLeaderboard";
import { TeamRangeSelect } from "@/components/dashboard/TeamRangeSelect";
import { cn } from "@/lib/utils";
import {
  aggregateTeamMembers,
  buildTeamInsights,
  parseTeamRange,
  sharePercent,
  teamRangeWindow,
  type TeamInsightTone,
} from "@/lib/team-analytics";
import { BarChart3, Clock, Gem, Heart, Send, Trophy, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function TeamKpiCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-fg">
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </p>
        <p className="text-xs text-muted-fg">{label}</p>
      </div>
    </div>
  );
}

const INSIGHT_ICON: Record<TeamInsightTone, typeof Trophy> = {
  top: Trophy,
  balanced: Users,
  growth: Gem,
  people: Heart,
};

const INSIGHT_COLOR: Record<TeamInsightTone, string> = {
  top: "text-amber-500",
  balanced: "text-whatsapp-deep dark:text-whatsapp",
  growth: "text-blue-500",
  people: "text-whatsapp-deep dark:text-whatsapp",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string | string[] };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const range = parseTeamRange(searchParams?.range);
  const { since, until, label } = teamRangeWindow(range);

  const { data: links } = await supabase
    .from("direct_links")
    .select("id")
    .eq("user_id", user.id);

  const linkIds = (links ?? []).map((link) => link.id as string);
  const ids = linkIds.length > 0 ? linkIds : ["none"];

  const membersQuery = supabase
    .from("direct_link_team_members")
    .select("name, country_code, phone_number, active")
    .in("direct_link_id", ids);

  // Paginated: a plain `.limit(5000)` is capped at PostgREST's 1000-row max,
  // which made the leaderboard lose older redirects as click volume grew.
  const clicksPromise = fetchAllRows<{
    assigned_member_id: string | null;
    assigned_name: string | null;
    assigned_phone: string | null;
  }>((from, to) => {
    let query = supabase
      .from("direct_link_clicks")
      .select("assigned_member_id, assigned_name, assigned_phone")
      .in("direct_link_id", ids)
      .eq("is_bot", false)
      .eq("redirect_status", "ok")
      .lte("clicked_at", until.toISOString())
      .order("clicked_at", { ascending: false })
      .range(from, to);

    if (since) {
      query = query.gte("clicked_at", since.toISOString());
    }
    return query;
  });

  const [{ data: members }, clicks] = await Promise.all([membersQuery, clicksPromise]);

  const memberList = (members ?? []) as {
    name: string;
    country_code: string;
    phone_number: string;
    active: boolean;
  }[];
  const clickList = clicks;

  const rows = aggregateTeamMembers(memberList, clickList);
  const totalRedirects = clickList.length;
  const assigned = clickList.filter((c) => c.assigned_phone || c.assigned_name).length;
  const membersCount = new Set(
    memberList
      .filter((member) => member.active)
      .map((member) => `${member.country_code}${member.phone_number}` || member.name)
  ).size;
  const accounted = totalRedirects > 0 ? Math.round(sharePercent(assigned, totalRedirects)) : 0;
  const averagePerMember = membersCount > 0 ? Math.round(totalRedirects / membersCount) : 0;
  const insights = buildTeamInsights(rows);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-whatsapp-deep dark:text-whatsapp">
            Team Analytics
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            WhatsApp Distribution by Team Member
          </h1>
          <p className="mt-1.5 text-sm text-muted-fg">
            Who received WhatsApp redirects after weighted distribution.
          </p>
        </div>
        <TeamRangeSelect value={range} label={label} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamKpiCard icon={Users} value={membersCount} label="Team members" />
        <TeamKpiCard icon={Send} value={totalRedirects} label="Total WhatsApp redirects" />
        <TeamKpiCard icon={BarChart3} value={averagePerMember} label="Average per member" />
        <TeamKpiCard icon={Clock} value={`${accounted}%`} label="Distribution accounted" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <TeamLeaderboard rows={rows} membersCount={membersCount} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-4 rounded-lg bg-whatsapp/[0.07] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-whatsapp/15 text-whatsapp-deep dark:text-whatsapp">
                <BarChart3 className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">Stronger together</p>
                <p className="mt-0.5 text-xs text-muted-fg">
                  Every conversation moves us closer to our goals.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-border">
              {insights.map((insight) => {
                const Icon = INSIGHT_ICON[insight.tone];
                return (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <Icon
                      className={cn("mt-0.5 h-5 w-5 shrink-0", INSIGHT_COLOR[insight.tone])}
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg">{insight.title}</p>
                      <p className="mt-0.5 text-xs text-muted-fg">{insight.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
