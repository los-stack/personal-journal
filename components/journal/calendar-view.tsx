"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { uk } from "date-fns/locale";
import { BookOpen, CalendarDays, Loader2 } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { getEntries } from "@/lib/actions";
import type { JournalEntry } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntryCard } from "./entry-card";
import { Header } from "./header";

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSelectedDate(date: Date) {
  const label = date.toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toLocaleUpperCase("uk-UA") + label.slice(1);
}

function formatEntryCount(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} записів`;
  if (lastDigit === 1) return `${count} запис`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} записи`;
  return `${count} записів`;
}

export function CalendarView({ displayName }: { displayName: string }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(),
  );
  const { data: entries, error, isLoading, mutate } = useSWR(
    "entries",
    getEntries,
    { revalidateOnFocus: false },
  );
  const journalEntries = entries ?? [];

  const entriesByDate = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();

    journalEntries.forEach((entry) => {
      const key = getLocalDateKey(new Date(entry.created_at));
      const dayEntries = groups.get(key) ?? [];
      dayEntries.push(entry);
      groups.set(key, dayEntries);
    });

    return groups;
  }, [journalEntries]);

  const markedDays = useMemo(
    () =>
      Array.from(entriesByDate.keys(), (key) => {
        const [year, monthNumber, day] = key.split("-").map(Number);
        return new Date(year, monthNumber - 1, day);
      }) as Matcher[],
    [entriesByDate],
  );

  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-`;
  const monthlyEntries = journalEntries.filter((entry) =>
    getLocalDateKey(new Date(entry.created_at)).startsWith(monthPrefix),
  );
  const activeDays = Array.from(entriesByDate.keys()).filter((key) =>
    key.startsWith(monthPrefix),
  ).length;
  const selectedEntries = selectedDate
    ? [...(entriesByDate.get(getLocalDateKey(selectedDate)) ?? [])].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header displayName={displayName} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">Ваш журнал</p>
          <h1 className="text-3xl font-semibold tracking-tight">Календар</h1>
          <p className="mt-2 text-muted-foreground">
            Переглядайте записи за днями та помічайте свою активність.
          </p>
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Активність за місяць"
            className="mb-6 grid gap-4 sm:grid-cols-2"
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Записів за місяць</CardDescription>
                <BookOpen
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {monthlyEntries.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>Днів із записами</CardDescription>
                <CalendarDays
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground"
                />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {activeDays}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {isLoading ? (
          <div
            role="status"
            aria-label="Завантаження календаря"
            className="flex items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Не вдалося завантажити записи</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              <p>{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Спробувати ще раз
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Оберіть день</CardTitle>
                <CardDescription>
                  Позначка в календарі означає, що за цей день є записи.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  locale={uk}
                  month={month}
                  onMonthChange={(nextMonth) => {
                    setMonth(nextMonth);
                    setSelectedDate(undefined);
                  }}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  showOutsideDays={false}
                  modifiers={{ hasEntries: markedDays }}
                  modifiersClassNames={{
                    hasEntries:
                      "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                  }}
                  className="mx-auto w-full [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(12)]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? formatSelectedDate(selectedDate) : "Записи дня"}
                </CardTitle>
                <CardDescription>
                  {selectedDate
                    ? formatEntryCount(selectedEntries.length)
                    : "Виберіть день у календарі, щоб переглянути записи."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEntries.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onUpdate={() => mutate()}
                      />
                    ))}
                  </div>
                ) : journalEntries.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <BookOpen
                        aria-hidden="true"
                        className="h-6 w-6 text-muted-foreground"
                      />
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Ваш календар заповниться, коли ви створите перший запис.
                    </p>
                    <Button asChild>
                      <Link href="/">Створити запис</Link>
                    </Button>
                  </div>
                ) : selectedDate ? (
                  <div className="py-8 text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                      За цей день записів немає. Оберіть інший день або додайте
                      новий запис.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/">Перейти до журналу</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Оберіть день у календарі, щоб переглянути записи.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
