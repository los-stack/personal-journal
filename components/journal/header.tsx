"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  LogOut,
  Moon,
  PenLine,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  displayName?: string;
}

export function Header({ displayName = "" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase("uk-UA");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <span className="hidden text-xl font-semibold tracking-tight text-foreground sm:inline">
            Personal Journal
          </span>
        </div>

        <nav aria-label="Основна навігація" className="flex items-center gap-1">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3",
              pathname === "/"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
            title="Журнал"
          >
            <PenLine aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sr-only xl:not-sr-only">Журнал</span>
          </Link>
          <Link
            href="/calendar"
            aria-current={pathname === "/calendar" ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3",
              pathname === "/calendar"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
            title="Календар"
          >
            <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sr-only xl:not-sr-only">Календар</span>
          </Link>
          <Link
            href="/insights"
            aria-current={pathname === "/insights" ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3",
              pathname === "/insights"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
            title="Огляд"
          >
            <BarChart3 aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sr-only xl:not-sr-only">Огляд</span>
          </Link>
          <Link
            href="/settings"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3",
              pathname.startsWith("/settings")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
            title="Профіль"
          >
            <Settings aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sr-only xl:not-sr-only">Профіль</span>
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <div
            role="img"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            title={displayName || "Профіль"}
            aria-label={displayName ? `Профіль: ${displayName}` : "Профіль"}
          >
            {initials || <UserRound aria-hidden="true" className="h-4 w-4" />}
          </div>
          {displayName && (
            <span className="hidden max-w-28 truncate text-sm font-medium lg:block">
              {displayName}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Перемкнути тему</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Вийти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
