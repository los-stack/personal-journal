import type { User } from "@supabase/supabase-js";

export function getProfileDisplayName(user: User): string {
  const values = [
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name,
  ];
  const name = values.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  return name?.trim() ?? "";
}
