import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DirectLinkFullEditor } from "@/components/direct-links/DirectLinkFullEditor";
import type { DirectLink } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function DirectLinkEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dl, error } = await supabase
    .from("direct_links")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !dl) {
    notFound();
  }

  return <DirectLinkFullEditor directLink={dl as DirectLink} />;
}
