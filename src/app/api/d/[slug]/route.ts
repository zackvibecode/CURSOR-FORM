/**
 * GET /api/d/[slug]
 *
 * Public redirect API for Direct Links.
 * Called by the client-side component — NOT by bots (which never run JS).
 *
 * Bot/crawler protection:
 *   • The /d/[slug] public page serves SEO metadata to ALL requests.
 *   • This API is only called after JavaScript executes (real browser).
 *   • Additionally, we check User-Agent as a secondary guard.
 *   • If a bot is detected we return 200 with is_bot:true and NO wa_url,
 *     recording a zero-cost click with is_bot=true.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: { slug: string } };

// Known bot/crawler User-Agent patterns (case-insensitive)
const BOT_UA_PATTERNS = [
  /facebookexternalhit/i,
  /facebot/i,
  /whatsapp/i,
  /twitterbot/i,
  /linkedinbot/i,
  /googlebot/i,
  /bingbot/i,
  /slackbot/i,
  /telegrambot/i,
  /discordbot/i,
  /applebot/i,
  /duckduckbot/i,
  /yahoo.*slurp/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /rogerbot/i,
  /screaming.frog/i,
  /crawler/i,
  /spider/i,
  /bot\b/i,
  /preview/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /node-fetch/i,
  /axios/i,
  /java\//i,
  /go-http-client/i,
  /okhttp/i,
];

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

function buildWaUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  if (!clean) return "";
  const text = message.trim() ? encodeURIComponent(message.trim()) : "";
  return text ? `https://wa.me/${clean}?text=${text}` : `https://wa.me/${clean}`;
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const ua = request.headers.get("user-agent");
  const referer = request.headers.get("referer");

  // UTM params
  const utm_source   = searchParams.get("utm_source");
  const utm_medium   = searchParams.get("utm_medium");
  const utm_campaign = searchParams.get("utm_campaign");
  const utm_content  = searchParams.get("utm_content");
  const utm_term     = searchParams.get("utm_term");

  const botDetected = isBot(ua);

  // Use admin client for atomic operations (service role bypasses RLS for writes)
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // ── 1. Fetch direct link ──────────────────────────────────────────────────
  const { data: dl } = await supabase
    .from("direct_links")
    .select("id, status, distribution_mode, whatsapp_message, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!dl) {
    return NextResponse.json({ error: "Direct link not found", redirect_status: "not_found" }, { status: 404 });
  }

  if (dl.status !== "published") {
    return NextResponse.json({ error: "This link is not published yet", redirect_status: "draft" }, { status: 403 });
  }

  // ── 2. Bot short-circuit — record as bot click, return no wa_url ──────────
  if (botDetected) {
    await supabase.from("direct_link_clicks").insert({
      direct_link_id: dl.id,
      distribution_mode: dl.distribution_mode,
      referrer: referer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      user_agent: ua,
      redirect_status: "bot",
      is_bot: true,
    });
    return NextResponse.json({ is_bot: true });
  }

  // ── 3. Resolve which team member to send to ───────────────────────────────
  let assignedMemberId: string | null = null;
  let assignedName: string | null = null;
  let assignedPhone: string | null = null;

  if (dl.distribution_mode === "single") {
    // Pick the first active member
    const { data: member } = await supabase
      .from("direct_link_team_members")
      .select("id, name, country_code, phone_number")
      .eq("direct_link_id", dl.id)
      .eq("active", true)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member) {
      assignedMemberId = member.id;
      assignedName = member.name;
      assignedPhone = member.country_code + member.phone_number;
    }

  } else if (dl.distribution_mode === "distribute") {
    // Weighted round-robin via atomic RPC
    const { data: slots } = await supabase.rpc("claim_direct_link_slot", {
      p_direct_link_id: dl.id,
    });

    if (Array.isArray(slots) && slots.length > 0) {
      const slot = slots[0] as { out_member_id: string; out_member_name: string; out_phone_full: string };
      assignedMemberId = slot.out_member_id;
      assignedName     = slot.out_member_name;
      assignedPhone    = slot.out_phone_full;
    }
  }

  // ── 4. Handle no available members ───────────────────────────────────────
  if (!assignedPhone) {
    await supabase.from("direct_link_clicks").insert({
      direct_link_id: dl.id,
      distribution_mode: dl.distribution_mode,
      referrer: referer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      user_agent: ua,
      redirect_status: "no_members",
      is_bot: false,
    });

    return NextResponse.json(
      { error: "No WhatsApp recipients configured for this link", redirect_status: "no_members" },
      { status: 503 }
    );
  }

  // ── 5. Build WhatsApp URL ────────────────────────────────────────────────
  const waUrl = buildWaUrl(assignedPhone, dl.whatsapp_message ?? "");

  // ── 6. Record click + update counters ────────────────────────────────────
  await Promise.all([
    supabase.from("direct_link_clicks").insert({
      direct_link_id: dl.id,
      assigned_member_id: assignedMemberId,
      assigned_name: assignedName,
      assigned_phone: assignedPhone,
      distribution_mode: dl.distribution_mode,
      referrer: referer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      user_agent: ua,
      redirect_status: "ok",
      is_bot: false,
    }),
    supabase.rpc("increment_direct_link_clicks", { p_id: dl.id }),
  ]);

  return NextResponse.json({ wa_url: waUrl, assigned_name: assignedName });
}
