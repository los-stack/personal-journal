"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Loader2,
  Smile,
} from "lucide-react";
import { getEntries } from "@/lib/actions";
import type { JournalEntry } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { moods } from "./moods";
import { Header } from "./header";

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getActivityDays(entries: JournalEntry[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));

    return {
      date,
      key: getLocalDateKey(date),
      label: new Intl.DateTimeFormat("uk-UA", { weekday: "short" })
        .format(date)
        .replace(".", ""),
      count: 0,
    };
  });
  const countsByDate = new Map(days.map((day) => [day.key, day]));

  entries.forEach((entry) => {
    const day = countsByDate.get(getLocalDateKey(new Date(entry.created_at)));
    if (day) day.count += 1;
  });

  return days;
}

function getMonthlyEntryCount(entries: JournalEntry[]) {
  const now = new Date();

  return entries.filter((entry) => {
    const date = new Date(entry.created_at);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;
}

function MoodDistribution({ entries }: { entries: JournalEntry[] }) {
  const counts = moods.map((mood) => ({
    ...mood,
    count: entries.filter((entry) => entry.mood === mood.value).length,
  }));
  const total = counts.reduce((sum, mood) => sum + mood.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настрої</CardTitle>
        <CardDescription>
          Розподіл записів із вказаним настроєм за весь час
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Додайте настрій до запису, щоб побачити розподіл.
          </p>
        ) : (
          <ul className="space-y-4">
            {counts
              .filter((mood) => mood.count > 0)
              .map((mood) => {
                const percentage = Math.round((mood.count / total) * 100);

                return (
                  <li key={mood.value} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        <span aria-hidden="true" className="mr-2">
                          {mood.emoji}
                        </span>
                        {mood.label}
                      </span>
                      <span className="text-muted-foreground">
                        {mood.count} · {percentage}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={mood.label}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={mood.count}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityChart({ entries }: { entries: JournalEntry[] }) {
  const days = getActivityDays(entries);
  const maxCount = Math.max(...days.map((day) => day.count), 1);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Активність</CardTitle>
        <CardDescription>Кількість записів за останні 7 днів</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            За останні 7 днів записів ще немає.
          </p>
        ) : (
          <div
            role="img"
            aria-label={`За останні 7 днів створено записів: ${total}`}
            className="grid grid-cols-7 gap-2"
          >
            {days.map((day) => (
              <div
                key={day.key}
                className="flex min-w-0 flex-col items-center gap-2"
                title={`${day.count} ${day.count === 1 ? "запис" : "записів"}`}
              >
                <span className="text-xs tabular-nums text-muted-foreground">
                  {day.count}
                </span>
                <div className="flex h-24 w-full items-end rounded-md bg-muted/60 p-1">
                  <div
                    className="w-full rounded-sm bg-primary"
                    style={{
                      height: `${Math.max((day.count / maxCount) * 100, day.count ? 8 : 0)}%`,
                    }}
                  />
                </div>
                <span className="truncate text-xs capitalize text-muted-foreground">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InsightsDashboard({ displayName }: { displayName: string }) {
  const { data: entries, error, isLoading, mutate } = useSWR(
    "entries",
    getEntries,
    { revalidateOnFocus: false },
  );
  const journalEntries = entries ?? [];
  const entriesWithMood = journalEntries.filter((entry) => entry.mood !== null);
  const topMood = moods
    .map((mood) => ({
      ...mood,
      count: entriesWithMood.filter((entry) => entry.mood === mood.value).length,
    }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="min-h-screen bg-background">
      <Header displayName={displayName} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">Ваш журнал</p>
          <h1 className="text-3xl font-semibold tracking-tight">Огляд</h1>
          <p className="mt-2 text-muted-foreground">
            Невеликий огляд записів і настроїв у вашому журналі.
          </p>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-label="Завантаження статистики"
            className="flex items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Не вдалося завантажити огляд</AlertTitle>
            <AlertDescription>
              <p>{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Спробувати ще раз
              </Button>
            </AlertDescription>
          </Alert>
        ) : journalEntries.length === 0 ? (
          <Card className="mx-auto max-w-xl text-center">
            <CardContent className="flex flex-col items-center pt-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="mb-2">Огляд з’явиться з вашими записами</CardTitle>
              <CardDescription className="mb-5">
                Створіть перший запис, щоб побачити статистику настроїв та
                активності.
              </CardDescription>
              <Button asChild>
                <Link href="/">Перейти до журналу</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section
              aria-label="Коротко про журнал"
              className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Усього записів</CardDescription>
                  <BookOpen aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums">
                    {journalEntries.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Цього місяця</CardDescription>
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums">
                    {getMonthlyEntryCount(journalEntries)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Із настроєм</CardDescription>
                  <Smile aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tabular-nums">
                    {entriesWithMood.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>Частий настрій</CardDescription>
                  <ChartNoAxesCombined aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="truncate text-lg font-semibold">
                    {topMood && topMood.count > 0
                      ? `${topMood.emoji} ${topMood.label}`
                      : "Ще не вказано"}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section
              aria-label="Статистика журналу"
              className="grid gap-6 lg:grid-cols-2"
            >
              <MoodDistribution entries={journalEntries} />
              <ActivityChart entries={journalEntries} />
            </section>
          </>
        )}

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Activity aria-hidden="true" className="h-3.5 w-3.5" />
          Статистика оновлюється разом із вашими записами.
        </p>
      </main>
    </div>
  );
}
