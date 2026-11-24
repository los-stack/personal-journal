"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ tags, onChange, disabled = false }: TagInputProps) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const tag = value.trim().toLocaleLowerCase("uk-UA");
    if (!tag) return;

    if (!/^[\p{L}\p{N}_ -]{1,24}$/u.test(tag)) {
      setError("Використовуйте до 24 літер, цифр, пробілів, дефісів або _");
      return;
    }
    if (tags.includes(tag)) {
      setError("Такий тег уже є");
      return;
    }
    if (tags.length >= 5) {
      setError("До запису можна додати не більше 5 тегів");
      return;
    }

    onChange([...tags, tag]);
    setValue("");
    setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 py-1 pl-3 pr-1 text-sm"
          >
            {tag}
            <button
              type="button"
              aria-label={`Видалити тег ${tag}`}
              disabled={disabled}
              onClick={() => {
                onChange(tags.filter((item) => item !== tag));
                setError(null);
              }}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          maxLength={24}
          disabled={disabled || tags.length >= 5}
          aria-label="Новий тег"
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          placeholder={tags.length >= 5 ? "Досягнуто ліміт тегів" : "Додати тег"}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Додати тег"
          disabled={disabled || !value.trim() || tags.length >= 5}
          onClick={addTag}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          До 5 тегів. Підтвердіть тег клавішею Enter або кнопкою +.
        </p>
      )}
    </div>
  );
}
