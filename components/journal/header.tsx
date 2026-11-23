"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  LogOut,
  Moon,
  PenLine,
  Sun,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

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
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === "/"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <PenLine className="h-4 w-4" />
            Журнал
          </Link>
          <Link
            href="/insights"
            aria-current={pathname === "/insights" ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === "/insights"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Огляд
          </Link>
        </nav>

        <div className="flex items-center gap-1">
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
