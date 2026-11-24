import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JournalPage } from "@/components/journal/journal-page";
import { getProfileDisplayName } from "@/lib/profile";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <JournalPage displayName={getProfileDisplayName(user)} />;
}
