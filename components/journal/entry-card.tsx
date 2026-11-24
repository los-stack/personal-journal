"use client";

import {
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from "react";
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
import {
  addEntryImage,
  deleteEntry,
  deleteEntryImage,
  setEntryPinned,
  updateEntry,
} from "@/lib/actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { moods } from "./moods";
import { TagInput } from "./tag-input";

interface EntryCardProps {
  entry: JournalEntry;
  onUpdate?: () => void;
}

const maxSourceImageSize = 20 * 1024 * 1024;
const maxUploadedImageSize = 4 * 1024 * 1024;
const maxImagesPerEntry = 3;
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function optimizeImage(file: File): Promise<File> {
  if (!supportedImageTypes.has(file.type)) {
    throw new Error("Оберіть фото у форматі JPG, PNG або WebP.");
  }
  if (file.size > maxSourceImageSize) {
    throw new Error("Оригінал фото не має перевищувати 20 МБ.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("Браузер не підтримує оптимізацію фото.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не вдалося прочитати файл як зображення.");
  }

  const maxDimension = 1600;
  const scale = Math.min(
    1,
    maxDimension / bitmap.width,
    maxDimension / bitmap.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  try {
    if (!context) throw new Error("Не вдалося підготувати фото до завантаження.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Не вдалося оптимізувати фото.")),
        "image/webp",
        0.82,
      );
    });

    if (!supportedImageTypes.has(blob.type)) {
      throw new Error("Браузер не зміг перетворити фото у підтримуваний формат.");
    }
    if (blob.size > maxUploadedImageSize) {
      throw new Error(
        "Оптимізоване фото перевищує 4 МБ. Спробуйте менше зображення.",
      );
    }

    const extension =
      blob.type === "image/png"
        ? "png"
        : blob.type === "image/jpeg"
          ? "jpg"
          : "webp";
    return new File([blob], `journal-image.${extension}`, { type: blob.type });
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} МБ`
    : `${Math.max(1, Math.round(size / 1024))} КБ`;
}

export function EntryCard({ entry, onUpdate }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [title, setTitle] = useState(entry.title || "");
  const [content, setContent] = useState(entry.content);
  const [tags, setTags] = useState(entry.tags ?? []);
  const [refreshedImageIds, setRefreshedImageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const imageInputId = useId();
  const mood = moods.find((option) => option.value === entry.mood);
  const images = entry.images ?? [];

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

  const handleImageFiles = (files: File[]) => {
    if (files.length === 0) return;
    const remainingSlots = maxImagesPerEntry - images.length;
    if (files.length > remainingSlots) {
      setActionError(`До запису можна додати ще ${remainingSlots} фото.`);
      return;
    }

    setActionError(null);
    setUploadStatus(null);
    let uploadedCount = 0;
    let registrationMayHaveCompleted = false;
    const supabase = createSupabaseClient();
    startTransition(async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setActionError("Сесію завершено. Увійдіть знову та спробуйте ще раз.");
        return;
      }

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        let storagePath: string | null = null;
        let wasUploaded = false;
        let registrationStarted = false;
        try {
          setUploadStatus(`Оптимізуємо фото ${index + 1} з ${files.length}…`);
          const optimizedFile = await optimizeImage(file);
          const extension =
            optimizedFile.type === "image/png"
              ? "png"
              : optimizedFile.type === "image/jpeg"
                ? "jpg"
                : "webp";

          storagePath = `${session.user.id}/${entry.id}/${crypto.randomUUID()}.${extension}`;
          setUploadStatus(
            `Передаємо фото ${index + 1} з ${files.length} · ${formatFileSize(optimizedFile.size)}`,
          );
          const { error: uploadError } = await supabase.storage
            .from("journal-entry-images")
            .upload(storagePath, optimizedFile, {
              contentType: optimizedFile.type,
              cacheControl: "3600",
              upsert: false,
            });
          if (uploadError) {
            console.error("Error uploading journal image:", uploadError);
            throw new Error(
              "Не вдалося завантажити фото. Перевірте, що SQL-міграцію фото застосовано в Supabase.",
            );
          }
          wasUploaded = true;

          registrationStarted = true;
          const result = await addEntryImage(entry.id, storagePath);
          if (!result.success) {
            const { error: cleanupError } = await supabase.storage
              .from("journal-entry-images")
              .remove([storagePath]);
            if (cleanupError) {
              console.error("Error cleaning up an unregistered journal image:", cleanupError);
            }
            wasUploaded = false;
            setActionError(result.error || "Не вдалося додати фото.");
            break;
          }
          wasUploaded = false;
          uploadedCount += 1;
        } catch (error) {
          if (registrationStarted) registrationMayHaveCompleted = true;
          if (storagePath && wasUploaded && !registrationStarted) {
            const { error: cleanupError } = await supabase.storage
              .from("journal-entry-images")
              .remove([storagePath]);
            if (cleanupError) {
              console.error("Error cleaning up an unregistered journal image:", cleanupError);
            }
          }
          setActionError(
            error instanceof Error ? error.message : "Не вдалося обробити фото.",
          );
          break;
        }
      }

      setUploadStatus(null);
      if (uploadedCount > 0 || registrationMayHaveCompleted) onUpdate?.();
    });
  };

  const handleImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.target.value = "";
    handleImageFiles(files);
  };

  const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);
    if (!isPending) handleImageFiles(Array.from(event.dataTransfer.files));
  };

  const handleImageDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isPending) setIsDraggingImage(true);
  };

  const handleImageDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (
      !event.relatedTarget ||
      !event.currentTarget.contains(event.relatedTarget as Node)
    ) {
      setIsDraggingImage(false);
    }
  };

  const handleDeleteImage = () => {
    if (!imageToDelete) return;

    setActionError(null);
    startTransition(async () => {
      const result = await deleteEntryImage(imageToDelete);
      if (result.success) {
        setImageToDelete(null);
        onUpdate?.();
      } else {
        setActionError(result.error || "Не вдалося видалити фото.");
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

            <section aria-label="Фото до запису" className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Фото
                </h4>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
                  {images.length}/{maxImagesPerEntry}
                </span>
              </div>
              {images.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <li
                      key={image.id}
                      className="group/image relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Відкрити фото ${index + 1} у новій вкладці`}
                        className="block h-full w-full"
                      >
                        <img
                          src={image.url}
                          alt={`Фото ${index + 1} до запису`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover/image:scale-105"
                          onError={() => {
                            if (refreshedImageIds.has(image.id)) return;
                            setRefreshedImageIds((current) => {
                              const next = new Set(current);
                              next.add(image.id);
                              return next;
                            });
                            onUpdate?.();
                          }}
                        />
                      </a>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        aria-label={`Видалити фото ${index + 1}`}
                        title="Видалити фото"
                        disabled={isPending}
                        onClick={() => setImageToDelete(image.id)}
                        className="absolute right-2 top-2 h-8 w-8 opacity-100 shadow-sm sm:opacity-0 sm:group-hover/image:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {images.length < maxImagesPerEntry && (
                <label
                  htmlFor={imageInputId}
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop}
                  className={cn(
                    "group/upload flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-3 transition-colors",
                    isDraggingImage
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5",
                    isPending && "pointer-events-none opacity-70",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  )}
                >
                  <input
                    id={imageInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    aria-label="Оберіть фото до запису"
                    disabled={isPending}
                    onChange={handleImageSelected}
                  />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover/upload:bg-primary/15">
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      role={uploadStatus ? "status" : undefined}
                      aria-live="polite"
                      className="block text-sm font-medium text-foreground"
                    >
                      {uploadStatus || "Додати фото"}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Перетягніть сюди або оберіть · JPG, PNG, WebP до 20 МБ · оптимізується автоматично
                    </span>
                  </span>
                </label>
              )}
            </section>
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

      <AlertDialog
        open={imageToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setImageToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити фото?</AlertDialogTitle>
            <AlertDialogDescription>
              Фото буде остаточно видалено зі сховища.
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
              onClick={handleDeleteImage}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Видалення...
                </>
              ) : (
                "Видалити фото"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
