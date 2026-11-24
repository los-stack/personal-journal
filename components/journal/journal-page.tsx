"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import type { DateRange } from "react-day-picker";
import { uk } from "date-fns/locale";
import { Header } from "./header";
import { EntryEditor } from "./entry-editor";
import { EntryList } from "./entry-list";
import { getEntries } from "@/lib/actions";
import {
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createJournalMarkdown } from "@/lib/exports/markdown";
import { createJournalPrintHtml } from "@/lib/exports/print";
import { moods } from "./moods";

export function JournalPage({ displayName }: { displayName: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [exportError, setExportError] = useState<string | null>(null);
  const { data: entries, error, isLoading, mutate } = useSWR(
    "entries",
    getEntries,
    { revalidateOnFocus: false },
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const availableTags = useMemo(
    () =>
      [...new Set((entries ?? []).flatMap((entry) => entry.tags ?? []))].sort(
        (a, b) => a.localeCompare(b, "uk-UA"),
      ),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("uk-UA");

    return (entries ?? []).filter((entry) => {
      const matchesQuery =
        !query ||
        `${entry.title ?? ""}\n${entry.content}\n${(entry.tags ?? []).join(" ")}`
          .toLocaleLowerCase("uk-UA")
          .includes(query);
      const matchesMood =
        selectedMood === "all" || entry.mood === selectedMood;
      const matchesTag =
        selectedTag === "all" || (entry.tags ?? []).includes(selectedTag);
      const entryDate = new Date(entry.created_at);
      const rangeStart = dateRange?.from
        ? new Date(
            dateRange.from.getFullYear(),
            dateRange.from.getMonth(),
            dateRange.from.getDate(),
          )
        : null;
      const lastSelectedDate = dateRange?.to ?? dateRange?.from;
      const rangeEnd = lastSelectedDate
        ? new Date(
            lastSelectedDate.getFullYear(),
            lastSelectedDate.getMonth(),
            lastSelectedDate.getDate() + 1,
          )
        : null;
      const matchesDate =
        (!rangeStart || entryDate >= rangeStart) &&
        (!rangeEnd || entryDate < rangeEnd);

      return matchesQuery && matchesMood && matchesTag && matchesDate;
    });
  }, [entries, searchQuery, selectedMood, selectedTag, dateRange]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedMood !== "all" ||
    selectedTag !== "all" ||
    Boolean(dateRange);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMood("all");
    setSelectedTag("all");
    setDateRange(undefined);
  };

  const formatFileDate = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

  const handleMarkdownExport = () => {
    if (filteredEntries.length === 0) return;

    setExportError(null);
    const content = createJournalMarkdown(filteredEntries);
    const file = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    const exportRange = dateRange?.from
      ? `${formatFileDate(dateRange.from)}${dateRange.to ? `_${formatFileDate(dateRange.to)}` : ""}`
      : formatFileDate(new Date());
    link.download = `personal-journal-${exportRange}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePdfExport = () => {
    if (filteredEntries.length === 0) return;

    setExportError(null);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setExportError(
        "Браузер заблокував вікно друку. Дозвольте спливаючі вікна для цього сайту й спробуйте ще раз.",
      );
      return;
    }

    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(createJournalPrintHtml(filteredEntries));
    printWindow.document.close();
    printWindow.focus();
    const imagesReady = Promise.all(
      Array.from(printWindow.document.images).map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
      ),
    );
    const imageTimeout = new Promise<void>((resolve) => {
      printWindow.setTimeout(resolve, 5000);
    });
    void Promise.race([imagesReady, imageTimeout]).then(() => {
      if (!printWindow.closed) printWindow.print();
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header displayName={displayName} />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <EntryEditor onSuccess={handleRefresh} />
        </div>

        {!isLoading && !error && entries && entries.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_150px_150px_210px]">
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
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger aria-label="Фільтр за тегом" className="w-full">
                  <SelectValue placeholder="Усі теги" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі теги</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      #{tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    aria-label="Фільтр за датою"
                    className="w-full justify-start gap-2 font-normal"
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {dateRange?.from
                        ? dateRange.to
                          ? `${dateRange.from.toLocaleDateString("uk-UA")} – ${dateRange.to.toLocaleDateString("uk-UA")}`
                          : dateRange.from.toLocaleDateString("uk-UA")
                        : "Усі дати"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={uk}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p aria-live="polite">
                Знайдено записів: {filteredEntries.length}
              </p>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Очистити
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={filteredEntries.length === 0}
                      aria-label="Експортувати записи"
                    >
                      <Download className="h-4 w-4" />
                      Експорт
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuLabel>Оберіть формат експорту</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={handleMarkdownExport}
                      className="items-start py-2.5"
                    >
                      <FileText className="mt-0.5" />
                      <span>
                        <span className="block font-medium">Markdown (.md)</span>
                        <span className="block whitespace-normal text-xs text-muted-foreground">
                          Текстовий формат для зберігання й перенесення
                        </span>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={handlePdfExport}
                      className="items-start py-2.5"
                    >
                      <Printer className="mt-0.5" />
                      <span>
                        <span className="block font-medium">Друк або PDF</span>
                        <span className="block whitespace-normal text-xs text-muted-foreground">
                          У вікні друку виберіть «Зберегти як PDF»
                        </span>
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {exportError && (
              <p role="alert" className="text-right text-sm text-destructive">
                {exportError}
              </p>
            )}
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
