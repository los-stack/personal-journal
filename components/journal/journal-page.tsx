"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { Header } from "./header";
import { EntryEditor } from "./entry-editor";
import { EntryList } from "./entry-list";
import { getEntries } from "@/lib/actions";
import { Loader2 } from "lucide-react";

export function JournalPage() {
  const { data: entries, isLoading, mutate } = useSWR("entries", getEntries, {
    revalidateOnFocus: false,
  });

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
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <EntryList entries={entries || []} onUpdate={handleRefresh} />
        )}
      </main>
    </div>
  );
}
