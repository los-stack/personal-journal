import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Помилка авторизації
          </h1>
        </div>

        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-muted-foreground">
            Виникла помилка під час авторизації. Будь ласка, спробуйте ще раз
            або зверніться до підтримки.
          </p>
        </div>

        <Button variant="outline" asChild className="w-full bg-transparent">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Спробувати ще раз
          </Link>
        </Button>
      </div>
    </div>
  );
}
