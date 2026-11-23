"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Header } from "./header";
import { EntryEditor } from "./entry-editor";
import { EntryList } from "./entry-list";
import { getEntries } from "@/lib/actions";
import { Loader2, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moods } from "./moods";

export function JournalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("all");
  const { data: entries, error, isLoading, mutate } = useSWR(
    "entries",
    getEntries,
    { revalidateOnFocus: false },
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("uk-UA");

    return (entries ?? []).filter((entry) => {
      const matchesQuery =
        !query ||
        `${entry.title ?? ""}\n${entry.content}`
          .toLocaleLowerCase("uk-UA")
          .includes(query);
      const matchesMood =
        selectedMood === "all" || entry.mood === selectedMood;

      return matchesQuery && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedMood !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMood("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <EntryEditor onSuccess={handleRefresh} />
        </div>

        {!isLoading && !error && entries && entries.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Пошук у записах"
                  placeholder="Пошук за заголовком або текстом"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger aria-label="Фільтр за настроєм" className="w-full">
                  <SelectValue placeholder="Усі настрої" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі настрої</SelectItem>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p aria-live="polite">
                Знайдено записів: {filteredEntries.length}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Очистити
                </Button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div
            className="flex items-center justify-center py-16"
            role="status"
            aria-label="Завантаження записів"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Не вдалося завантажити записи</AlertTitle>
            <AlertDescription>
              <p>{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Спробувати ще раз
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <EntryList
            entries={filteredEntries}
            onUpdate={handleRefresh}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}
      </main>
    </div>
  );
}
