import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DirectLinksDashboard } from "@/components/direct-links/DirectLinksDashboard";
import type { DirectLink } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function DirectLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: directLinks } = await supabase
    .from("direct_links")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <DirectLinksDashboard directLinks={(directLinks ?? []) as DirectLink[]} />;
}
