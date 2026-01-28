"use client";

import { useState, useTransition } from "react";
import type { JournalEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateEntry, deleteEntry } from "@/lib/actions";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const moodEmojis: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  neutral: "😐",
  excited: "🤩",
  sad: "😢",
  anxious: "😰",
};

interface EntryCardProps {
  entry: JournalEntry;
  onUpdate?: () => void;
}

export function EntryCard({ entry, onUpdate }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState(entry.title || "");
  const [content, setContent] = useState(entry.content);
  const [isPending, startTransition] = useTransition();

  const formattedDate = new Date(entry.created_at).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(entry.created_at).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSave = () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (entry.mood) formData.append("mood", entry.mood);

    startTransition(async () => {
      const result = await updateEntry(entry.id, formData);
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEntry(entry.id);
      if (result.success) {
        setShowDeleteDialog(false);
        onUpdate?.();
      }
    });
  };

  const handleCancel = () => {
    setTitle(entry.title || "");
    setContent(entry.content);
    setIsEditing(false);
  };

  return (
    <>
      <article
        className={cn(
          "group rounded-xl border border-border bg-card p-6 transition-all",
          !isEditing && "hover:border-primary/30 hover:shadow-sm"
        )}
      >
        {isEditing ? (
          <div className="space-y-4">
            <Input
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 bg-transparent px-0 text-lg font-medium focus-visible:ring-0"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 bg-transparent px-0 font-serif text-base leading-relaxed focus-visible:ring-0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                Скасувати
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Збереження...
                  </>
                ) : (
                  "Зберегти"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <time className="text-sm text-muted-foreground">
                  {formattedDate} о {formattedTime}
                </time>
                {entry.mood && moodEmojis[entry.mood] && (
                  <span className="text-lg" title={entry.mood}>
                    {moodEmojis[entry.mood]}
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Меню</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Редагувати
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Видалити
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {entry.title && (
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {entry.title}
              </h3>
            )}

            <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground/90">
              {entry.content}
            </p>
          </>
        )}
      </article>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити запис?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Запис буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Видалення...
                </>
              ) : (
                "Видалити"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
