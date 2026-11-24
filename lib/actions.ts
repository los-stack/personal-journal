"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import type { JournalEntry } from "@/lib/types";
import { parseEntryFormData } from "@/lib/validation/entry";

const missingSchemaErrorCodes = new Set(["PGRST204", "PGRST205", "42703"]);
const schemaUpdateMessage =
  "Схему бази не оновлено. Виконайте останню SQL-міграцію з README.";

export async function getEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching entries:", error);
    if (missingSchemaErrorCodes.has(error.code)) {
      throw new Error(schemaUpdateMessage);
    }
    throw new Error("Не вдалося завантажити записи. Спробуйте ще раз.");
  }

  return data;
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
  const parsedEntry = parseEntryFormData(formData);
  if (!parsedEntry.success) {
    return { success: false, error: parsedEntry.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      ...parsedEntry.data,
      is_pinned: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating entry:", error);
    if (missingSchemaErrorCodes.has(error.code)) {
      return {
        success: false,
        error: schemaUpdateMessage,
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
  const parsedEntry = parseEntryFormData(formData);
  if (!parsedEntry.success) {
    return { success: false, error: parsedEntry.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .update({
      ...parsedEntry.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating entry:", error);
    if (missingSchemaErrorCodes.has(error.code)) {
      return {
        success: false,
        error: schemaUpdateMessage,
      };
    }
    if (error.code === "PGRST116") {
      return { success: false, error: "Запис не знайдено або немає доступу до нього" };
    }
    return { success: false, error: "Не вдалося оновити запис" };
  }

  revalidateTag("entries", "max");

  return { success: true };
}

export async function setEntryPinned(
  id: string,
  isPinned: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Не авторизовано" };
  }

  const { error } = await supabase
    .from("journal_entries")
    .update({ is_pinned: isPinned })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating pinned entry:", error);
    if (error.code === "PGRST116") {
      return { success: false, error: "Запис не знайдено або немає доступу до нього" };
    }
    if (missingSchemaErrorCodes.has(error.code)) {
      return {
        success: false,
        error: schemaUpdateMessage,
      };
    }
    return { success: false, error: "Не вдалося змінити закріплення запису" };
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
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("Error deleting entry:", error);
    if (missingSchemaErrorCodes.has(error.code)) {
      return {
        success: false,
        error: schemaUpdateMessage,
      };
    }
    if (error.code === "PGRST116") {
      return { success: false, error: "Запис не знайдено або немає доступу до нього" };
    }
    return { success: false, error: "Не вдалося видалити запис" };
  }

  revalidateTag("entries", "max");

  return { success: true };
}
