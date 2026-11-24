"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import type { JournalEntry, JournalEntryImage } from "@/lib/types";
import { parseEntryFormData } from "@/lib/validation/entry";

const missingSchemaErrorCodes = new Set(["PGRST204", "PGRST205", "42703"]);
const schemaUpdateMessage =
  "Схему бази не оновлено. Виконайте останню SQL-міграцію з README.";
const imageBucket = "journal-entry-images";
const maxImageSize = 4 * 1024 * 1024;
const maxImagesPerEntry = 3;

async function removeUnregisteredImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
) {
  const { error } = await supabase.storage
    .from(imageBucket)
    .remove([storagePath]);
  if (error) {
    console.error("Error cleaning up an unregistered journal image:", error);
  }
}

export async function getEntries(
  { includeImages = true }: { includeImages?: boolean } = {},
): Promise<JournalEntry[]> {
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

  if (!includeImages || data.length === 0) return data;

  const { data: imageRows, error: imagesError } = await supabase
    .from("journal_entry_images")
    .select("id, entry_id, storage_path, created_at")
    .in(
      "entry_id",
      data.map((entry) => entry.id),
    )
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("Error fetching journal entry images:", imagesError);
    if (missingSchemaErrorCodes.has(imagesError.code)) {
      throw new Error(schemaUpdateMessage);
    }
    throw new Error("Не вдалося завантажити фото записів. Спробуйте ще раз.");
  }

  const signedUrls =
    imageRows.length > 0
      ? await supabase.storage
          .from(imageBucket)
          .createSignedUrls(
            imageRows.map((image) => image.storage_path),
            60 * 60,
          )
      : { data: [], error: null };

  if (signedUrls.error || !signedUrls.data) {
    console.error("Error creating journal image URLs:", signedUrls.error);
    throw new Error("Не вдалося відкрити фото записів. Спробуйте ще раз.");
  }

  const imagesByEntry = new Map<string, JournalEntryImage[]>();
  imageRows.forEach((image, index) => {
    const signedUrl = signedUrls.data[index]?.signedUrl;
    if (!signedUrl) {
      throw new Error("Не вдалося відкрити фото запису. Спробуйте ще раз.");
    }
    const images = imagesByEntry.get(image.entry_id) ?? [];
    images.push({
      id: image.id,
      url: signedUrl,
      created_at: image.created_at,
    });
    imagesByEntry.set(image.entry_id, images);
  });

  return data.map((entry) => ({
    ...entry,
    images: imagesByEntry.get(entry.id) ?? [],
  }));
}

export async function addEntryImage(
  entryId: string,
  storagePath: string,
): Promise<{ success: boolean; error?: string }> {
  if (
    typeof entryId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      entryId,
    ) ||
    typeof storagePath !== "string"
  ) {
    return { success: false, error: "Некоректні дані фото." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Не авторизовано." };

  const [pathUserId, pathEntryId, fileName, ...extraPathParts] =
    storagePath.split("/");
  const extension = fileName?.split(".").pop()?.toLowerCase() ?? "";
  const expectedMimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  if (
    extraPathParts.length > 0 ||
    pathUserId !== user.id ||
    pathEntryId !== entryId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(fileName ?? "")
  ) {
    return { success: false, error: "Некоректний шлях до фото." };
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (entryError) {
    console.error("Error checking journal entry ownership:", entryError);
    return { success: false, error: "Не вдалося перевірити запис." };
  }
  if (!entry) {
    return { success: false, error: "Запис не знайдено або немає доступу до нього." };
  }

  const { data: storedImage, error: storageInfoError } = await supabase.storage
    .from(imageBucket)
    .info(storagePath);
  if (storageInfoError || !storedImage) {
    if (storageInfoError) {
      console.error("Error checking uploaded journal image:", storageInfoError);
    }
    await removeUnregisteredImage(supabase, storagePath);
    return { success: false, error: "Не вдалося перевірити завантажене фото." };
  }
  if (
    storedImage.bucketId !== imageBucket ||
    storedImage.contentType !== expectedMimeTypes[extension] ||
    (storedImage.size ?? maxImageSize + 1) > maxImageSize
  ) {
    await removeUnregisteredImage(supabase, storagePath);
    return {
      success: false,
      error: "Фото має бути JPG, PNG або WebP і не перевищувати 4 МБ після оптимізації.",
    };
  }

  const { count, error: countError } = await supabase
    .from("journal_entry_images")
    .select("id", { count: "exact", head: true })
    .eq("entry_id", entryId)
    .eq("user_id", user.id);

  if (countError) {
    console.error("Error checking journal image count:", countError);
    await removeUnregisteredImage(supabase, storagePath);
    if (missingSchemaErrorCodes.has(countError.code)) {
      return { success: false, error: schemaUpdateMessage };
    }
    return { success: false, error: "Не вдалося перевірити кількість фото." };
  }
  if ((count ?? 0) >= maxImagesPerEntry) {
    await removeUnregisteredImage(supabase, storagePath);
    return { success: false, error: "До одного запису можна додати не більше 3 фото." };
  }

  const { error: insertError } = await supabase
    .from("journal_entry_images")
    .insert({
      entry_id: entryId,
      user_id: user.id,
      storage_path: storagePath,
    });

  if (insertError) {
    console.error("Error saving journal image metadata:", insertError);
    await removeUnregisteredImage(supabase, storagePath);
    if (missingSchemaErrorCodes.has(insertError.code)) {
      return { success: false, error: schemaUpdateMessage };
    }
    if (insertError.message.includes("no more than 3 images")) {
      return {
        success: false,
        error: "До одного запису можна додати не більше 3 фото.",
      };
    }
    return { success: false, error: "Не вдалося зберегти фото до запису." };
  }

  revalidateTag("entries", "max");
  return { success: true };
}

export async function deleteEntryImage(
  imageId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Не авторизовано." };

  const { data: image, error: imageError } = await supabase
    .from("journal_entry_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (imageError) {
    console.error("Error fetching journal image for deletion:", imageError);
    if (missingSchemaErrorCodes.has(imageError.code)) {
      return { success: false, error: schemaUpdateMessage };
    }
    return { success: false, error: "Не вдалося знайти фото." };
  }
  if (!image) return { success: false, error: "Фото не знайдено." };

  const { error: storageError } = await supabase.storage
    .from(imageBucket)
    .remove([image.storage_path]);
  if (storageError) {
    console.error("Error deleting journal image file:", storageError);
    return { success: false, error: "Не вдалося видалити фото зі сховища." };
  }

  const { error: deleteError } = await supabase
    .from("journal_entry_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting journal image record:", deleteError);
    return {
      success: false,
      error: "Файл видалено, але не вдалося оновити запис. Оновіть сторінку.",
    };
  }

  revalidateTag("entries", "max");
  return { success: true };
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

  const { data: images, error: imagesError } = await supabase
    .from("journal_entry_images")
    .select("storage_path")
    .eq("entry_id", id)
    .eq("user_id", user.id);

  if (imagesError) {
    console.error("Error fetching images before deleting entry:", imagesError);
    if (missingSchemaErrorCodes.has(imagesError.code)) {
      return { success: false, error: schemaUpdateMessage };
    }
    return { success: false, error: "Не вдалося підготувати видалення запису." };
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

  if (images.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(imageBucket)
      .remove(images.map((image) => image.storage_path));

    if (storageError) {
      console.error("Error cleaning up files for deleted journal entry:", storageError);
    }
  }

  revalidateTag("entries", "max");

  return { success: true };
}
