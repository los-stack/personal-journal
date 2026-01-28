import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Перевірте вашу пошту
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Ми надіслали вам листа з посиланням для підтвердження акаунту.
            Перевірте вашу поштову скриньку та натисніть на посилання.
          </p>
        </div>

        <Button variant="outline" asChild className="w-full bg-transparent">
          <Link href="/auth/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Повернутися до входу
          </Link>
        </Button>
      </div>
    </div>
  );
}
