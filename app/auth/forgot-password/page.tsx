"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpen, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const redirectTo = new URL(
      "/auth/callback?next=/auth/update-password",
      window.location.origin,
    ).toString();
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    setIsLoading(false);

    if (requestError) {
      setError("Не вдалося надіслати лист. Перевірте адресу та спробуйте ще раз.");
      return;
    }

    setIsSent(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Відновлення пароля
          </h1>
          <p className="mt-2 text-muted-foreground">
            Вкажіть email, пов’язаний з акаунтом
          </p>
        </div>

        {isSent ? (
          <div
            role="status"
            className="space-y-4 rounded-xl border border-border bg-card p-6 text-center"
          >
            <MailCheck className="mx-auto h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Якщо акаунт із цією адресою існує, на неї надійде посилання для
              зміни пароля.
            </p>
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Повернутися до входу
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Надсилання...
                </>
              ) : (
                "Надіслати посилання"
              )}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Згадали пароль?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
