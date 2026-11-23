"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { Header } from "./header";
import { EntryEditor } from "./entry-editor";
import { EntryList } from "./entry-list";
import { getEntries } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function JournalPage() {
  const { data: entries, error, isLoading, mutate } = useSWR(
    "entries",
    getEntries,
    { revalidateOnFocus: false },
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <EntryEditor onSuccess={handleRefresh} />
        </div>

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
          <EntryList entries={entries ?? []} onUpdate={handleRefresh} />
        )}
      </main>
    </div>
  );
}
