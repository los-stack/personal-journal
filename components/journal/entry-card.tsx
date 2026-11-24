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
import { deleteEntry, setEntryPinned, updateEntry } from "@/lib/actions";
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { moods } from "./moods";
import { TagInput } from "./tag-input";

interface EntryCardProps {
  entry: JournalEntry;
  onUpdate?: () => void;
}

export function EntryCard({ entry, onUpdate }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState(entry.title || "");
  const [content, setContent] = useState(entry.content);
  const [tags, setTags] = useState(entry.tags ?? []);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const mood = moods.find((option) => option.value === entry.mood);

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
    if (!content.trim()) {
      setActionError("Напишіть щось перед збереженням");
      return;
    }

    setActionError(null);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (entry.mood) formData.append("mood", entry.mood);
    tags.forEach((tag) => formData.append("tags", tag));

    startTransition(async () => {
      const result = await updateEntry(entry.id, formData);
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
      } else {
        setActionError(result.error || "Не вдалося оновити запис");
      }
    });
  };

  const handleTogglePinned = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await setEntryPinned(entry.id, !entry.is_pinned);
      if (result.success) {
        onUpdate?.();
      } else {
        setActionError(result.error || "Не вдалося змінити закріплення запису");
      }
    });
  };

  const handleDelete = () => {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteEntry(entry.id);
      if (result.success) {
        setShowDeleteDialog(false);
        onUpdate?.();
      } else {
        setActionError(result.error || "Не вдалося видалити запис");
      }
    });
  };

  const handleCancel = () => {
    setTitle(entry.title || "");
    setContent(entry.content);
    setTags(entry.tags ?? []);
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
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 bg-transparent px-0 text-lg font-medium focus-visible:ring-0"
            />
            <Textarea
              value={content}
              maxLength={10000}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 bg-transparent px-0 font-serif text-base leading-relaxed focus-visible:ring-0"
              autoFocus
            />
            <TagInput tags={tags} onChange={setTags} disabled={isPending} />
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
            {actionError && (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <time className="text-sm text-muted-foreground">
                  {formattedDate} о {formattedTime}
                </time>
                {mood && (
                  <span className="text-lg" title={mood.label}>
                    {mood.emoji}
                  </span>
                )}
                {entry.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <Pin aria-hidden="true" className="h-3 w-3" />
                    Закріплено
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
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
                    onClick={handleTogglePinned}
                    disabled={isPending}
                  >
                    {entry.is_pinned ? (
                      <PinOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Pin className="mr-2 h-4 w-4" />
                    )}
                    {entry.is_pinned ? "Відкріпити" : "Закріпити"}
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

            {actionError && (
              <p role="alert" className="mb-3 text-sm text-destructive">
                {actionError}
              </p>
            )}

            {entry.tags?.length > 0 && (
              <ul aria-label="Теги запису" className="mb-3 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}

            <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground/90">
              {entry.content}
            </p>
          </>
        )}
      </article>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (open) setActionError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити запис?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Запис буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          )}
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
