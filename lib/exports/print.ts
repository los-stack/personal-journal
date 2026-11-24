import type { JournalEntry } from "@/lib/types";
import { moods } from "@/components/journal/moods";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatEntryDate(value: string) {
  return new Date(value).toLocaleString("uk-UA", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatEntryCount(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} записів`;
  if (lastDigit === 1) return `${count} запис`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} записи`;
  return `${count} записів`;
}

export function createJournalPrintHtml(entries: JournalEntry[]) {
  const entryMarkup = entries
    .map((entry) => {
      const mood = moods.find((option) => option.value === entry.mood);
      const title = entry.title?.trim() || "Запис без назви";
      const tags = entry.tags ?? [];

      return `
        <article class="entry">
          <div class="entry-meta">
            <time>${escapeHtml(formatEntryDate(entry.created_at))}</time>
            ${
              mood
                ? `<span class="mood">${escapeHtml(`${mood.emoji} ${mood.label}`)}</span>`
                : ""
            }
            ${
              entry.is_pinned
                ? '<span class="pinned">Закріплено</span>'
                : ""
            }
          </div>
          <h2>${escapeHtml(title)}</h2>
          ${
            tags.length
              ? `<p class="tags">${tags.map((tag) => `#${escapeHtml(tag)}`).join(" · ")}</p>`
              : ""
          }
          <p>${escapeHtml(entry.content.trim())}</p>
        </article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Personal Journal — ${entries.length} записів</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        max-width: 760px;
        margin: 0 auto;
        padding: 48px 36px;
        color: #29251f;
        background: #fff;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 15px;
        line-height: 1.7;
      }
      header {
        margin-bottom: 36px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e8e3dc;
      }
      .eyebrow {
        margin: 0 0 8px;
        color: #866b50;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 32px;
        font-weight: 500;
        line-height: 1.2;
      }
      .summary { margin: 10px 0 0; color: #746d64; font-size: 13px; }
      .entry {
        margin: 0 0 26px;
        padding: 0 0 26px;
        border-bottom: 1px solid #eeeae5;
        break-inside: avoid;
      }
      .entry:last-child { border-bottom: 0; }
      .entry-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
        color: #746d64;
        font-size: 12px;
      }
      .mood {
        padding: 2px 9px;
        border-radius: 999px;
        background: #f5f1eb;
        color: #5e5144;
      }
      .pinned {
        color: #866b50;
        font-weight: 600;
      }
      .entry .tags {
        margin: 0 0 10px;
        color: #866b50;
        font-size: 12px;
      }
      h2 {
        margin: 10px 0 8px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 21px;
        font-weight: 600;
        line-height: 1.35;
      }
      .entry p {
        margin: 0;
        color: #39352f;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      @page { size: A4; margin: 18mm; }
      @media print {
        body { max-width: none; padding: 0; font-size: 11pt; }
        header { margin-bottom: 24px; }
        h1 { font-size: 26pt; }
        h2 { font-size: 16pt; }
        .entry { margin-bottom: 18px; padding-bottom: 18px; }
        .mood { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <header>
      <p class="eyebrow">Особистий щоденник</p>
      <h1>Personal Journal</h1>
      <p class="summary">${escapeHtml(formatEntryCount(entries.length))} · Експортовано ${escapeHtml(new Date().toLocaleDateString("uk-UA"))}</p>
    </header>
    <main>${entryMarkup}</main>
  </body>
</html>`;
}
