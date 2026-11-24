import type { JournalEntry } from "@/lib/types";
import { moods } from "@/components/journal/moods";

function formatEntryDate(value: string) {
  return new Date(value).toLocaleString("uk-UA", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function createJournalMarkdown(entries: JournalEntry[]) {
  const sections = entries.map((entry) => {
    const mood = moods.find((option) => option.value === entry.mood);
    const title = entry.title?.trim() || "Запис без назви";
    const metadata = [
      `- Дата: ${formatEntryDate(entry.created_at)}`,
      ...(mood ? [`- Настрій: ${mood.emoji} ${mood.label}`] : []),
      ...(entry.is_pinned ? ["- Закріплено: так"] : []),
      ...(entry.tags?.length
        ? [`- Теги: ${entry.tags.map((tag) => `#${tag}`).join(", ")}`]
        : []),
    ];

    return [`## ${title}`, "", ...metadata, "", entry.content.trim()].join("\n");
  });

  return [
    "# Personal Journal",
    "",
    `Експортовано: ${new Date().toLocaleString("uk-UA")}`,
    `Записів: ${entries.length}`,
    "",
    ...sections.flatMap((section) => [section, "", "---", ""]),
  ].join("\n");
}
