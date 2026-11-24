import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/journal/account-settings";
import { Header } from "@/components/journal/header";
import { createClient } from "@/lib/supabase/server";
import { getProfileDisplayName } from "@/lib/profile";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName = getProfileDisplayName(user);

  return (
    <div className="min-h-screen bg-background">
      <Header displayName={displayName} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">Ваш акаунт</p>
          <h1 className="text-3xl font-semibold tracking-tight">Налаштування</h1>
          <p className="mt-2 text-muted-foreground">
            Керуйте даними профілю та безпекою акаунта.
          </p>
        </div>
        <AccountSettings
          displayName={displayName}
          email={user.email ?? ""}
        />
      </main>
    </div>
  );
}
