import { z } from "zod";

export const entryMoodSchema = z.enum([
  "happy",
  "neutral",
  "sad",
  "excited",
  "calm",
  "anxious",
]);

const entryTagSchema = z
  .string()
  .trim()
  .min(1, "Тег не може бути порожнім")
  .max(24, "Тег не може бути довшим за 24 символи")
  .regex(/^[\p{L}\p{N}_ -]+$/u, "У тегах дозволені літери, цифри, пробіл, дефіс і _")
  .transform((tag) => tag.toLocaleLowerCase("uk-UA"));

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
  tags: z
    .array(entryTagSchema)
    .max(5, "До запису можна додати не більше 5 тегів")
    .superRefine((tags, context) => {
      if (new Set(tags).size !== tags.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Теги не мають повторюватися",
        });
      }
    }),
});

export function parseEntryFormData(formData: FormData) {
  const title = formData.get("title");
  const content = formData.get("content");
  const mood = formData.get("mood");
  const tags = formData.getAll("tags");

  return entryFormSchema.safeParse({
    title: title === null ? "" : title,
    content,
    mood: mood === null || mood === "" ? null : mood,
    tags,
  });
}
