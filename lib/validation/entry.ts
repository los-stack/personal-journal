import { z } from "zod";

export const entryMoodSchema = z.enum([
  "happy",
  "neutral",
  "sad",
  "excited",
  "calm",
  "anxious",
]);

export const entryFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(120, "Заголовок не може бути довшим за 120 символів")
    .transform((title) => title || null),
  content: z
    .string()
    .trim()
    .min(1, "Напишіть щось перед збереженням")
    .max(10000, "Запис не може бути довшим за 10 000 символів"),
  mood: entryMoodSchema.nullable(),
});

export function parseEntryFormData(formData: FormData) {
  const title = formData.get("title");
  const content = formData.get("content");
  const mood = formData.get("mood");

  return entryFormSchema.safeParse({
    title: title === null ? "" : title,
    content,
    mood: mood === null || mood === "" ? null : mood,
  });
}
