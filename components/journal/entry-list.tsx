"use client";

import type { JournalEntry } from "@/lib/types";
import { EntryCard } from "./entry-card";
import { BookOpen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntryListProps {
  entries: JournalEntry[];
  onUpdate?: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function EntryList({
  entries,
  onUpdate,
  hasActiveFilters = false,
  onClearFilters,
}: EntryListProps) {
  if (entries.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            Нічого не знайдено
          </h3>
          <p className="mb-4 max-w-sm text-muted-foreground">
            Спробуйте змінити пошуковий запит або вибрати інший настрій.
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            Очистити фільтри
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">
          Ваш журнал порожній
        </h3>
        <p className="max-w-sm text-muted-foreground">
          Почніть записувати свої думки, ідеї та переживання. Кожен запис — це крок до самопізнання.
        </p>
      </div>
    );
  }

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, JournalEntry[]>>(
    (groups, entry) => {
      const date = new Date(entry.created_at).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {Object.entries(groupedEntries).map(([date, dateEntries]) => (
        <section key={date}>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {date}
          </h2>
          <div className="space-y-4">
            {dateEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onUpdate={onUpdate} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
