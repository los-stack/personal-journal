import { InsightsDashboard } from "@/components/journal/insights-dashboard";
import { getProfileDisplayName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <InsightsDashboard displayName={getProfileDisplayName(user)} />;
}
