"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import type { JournalEntry } from "@/lib/types";

export async function getEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching entries:", error);
    return [];
  }

  return data || [];
}

export async function getEntry(id: string): Promise<JournalEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching entry:", error);
    return null;
  }

  return data;
}

export async function createEntry(formData: FormData): Promise<{ success: boolean; error?: string; entry?: JournalEntry }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const title = formData.get("title") as string | null;
  const content = formData.get("content") as string;
  const mood = formData.get("mood") as string | null;

  if (!content || content.trim() === "") {
    return { success: false, error: "Зміст запису не може бути порожнім" };
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      title: title || null,
      content: content.trim(),
      mood: mood || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating entry:", error);
    if (error.code === "PGRST205") {
      return {
        success: false,
        error: "Таблицю записів не налаштовано. Виконайте SQL-міграцію з README.",
      };
    }
    return { success: false, error: "Не вдалося створити запис" };
  }

  revalidateTag("entries", "max");

  return { success: true, entry: data };
}

export async function updateEntry(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const title = formData.get("title") as string | null;
  const content = formData.get("content") as string;
  const mood = formData.get("mood") as string | null;

  if (!content || content.trim() === "") {
    return { success: false, error: "Зміст запису не може бути порожнім" };
  }

  const { error } = await supabase
    .from("journal_entries")
    .update({
      title: title || null,
      content: content.trim(),
      mood: mood || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating entry:", error);
    return { success: false, error: "Не вдалося оновити запис" };
  }

  revalidateTag("entries", "max");

  return { success: true };
}

export async function deleteEntry(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting entry:", error);
    return { success: false, error: "Не вдалося видалити запис" };
  }

  revalidateTag("entries", "max");

  return { success: true };
}
