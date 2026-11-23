"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createEntry } from "@/lib/actions";
import { PenLine, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { moods } from "./moods";

interface EntryEditorProps {
  onSuccess?: () => void;
}

export function EntryEditor({ onSuccess }: EntryEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!content.trim()) {
      setError("Напишіть щось перед збереженням");
      return;
    }

    setError(null);

    const formData = new FormData();
    if (title.trim()) formData.append("title", title.trim());
    formData.append("content", content);
    if (selectedMood) formData.append("mood", selectedMood);

    startTransition(async () => {
      const result = await createEntry(formData);

      if (result.success) {
        setTitle("");
        setContent("");
        setSelectedMood(null);
        setIsExpanded(false);
        onSuccess?.();
      } else {
        setError(result.error || "Щось пішло не так");
      }
    });
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setSelectedMood(null);
    setError(null);
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group w-full rounded-xl border border-dashed border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:bg-accent/50"
      >
        <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg">Що у вас на думці сьогодні?</span>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <Input
          placeholder="Заголовок (необов'язково)"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 bg-transparent px-0 text-lg font-medium placeholder:text-muted-foreground/60 focus-visible:ring-0"
        />

        <Textarea
          placeholder="Почніть писати..."
          value={content}
          maxLength={10000}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[150px] resize-none border-0 bg-transparent px-0 font-serif text-base leading-relaxed placeholder:text-muted-foreground/60 focus-visible:ring-0"
          autoFocus
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Як ви себе почуваєте?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                aria-pressed={selectedMood === mood.value}
                onClick={() =>
                  setSelectedMood(selectedMood === mood.value ? null : mood.value)
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                  selectedMood === mood.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isPending}
          >
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Збереження...
              </>
            ) : (
              "Зберегти запис"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
