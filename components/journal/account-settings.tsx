"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsProps {
  displayName: string;
  email: string;
}

interface FormFeedback {
  type: "success" | "error";
  message: string;
}

function Feedback({ feedback }: { feedback: FormFeedback | null }) {
  if (!feedback) return null;

  const isError = feedback.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <Alert variant={isError ? "destructive" : "default"} role="status">
      <Icon aria-hidden="true" />
      <AlertDescription>{feedback.message}</AlertDescription>
    </Alert>
  );
}

export function AccountSettings({ displayName, email }: AccountSettingsProps) {
  const [name, setName] = useState(displayName);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileFeedback, setProfileFeedback] = useState<FormFeedback | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<FormFeedback | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<FormFeedback | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFeedback(null);
    setSavingProfile(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim() },
    });

    setSavingProfile(false);
    setProfileFeedback(
      error
        ? { type: "error", message: error.message }
        : { type: "success", message: "Ім’я профілю збережено." },
    );
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailFeedback(null);

    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailFeedback({
        type: "error",
        message: "Це вже адреса email вашого акаунта.",
      });
      return;
    }

    setSavingEmail(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });
    setSavingEmail(false);

    setEmailFeedback(
      error
        ? { type: "error", message: error.message }
        : {
            type: "success",
            message:
              "Перевірте пошту: Supabase надішле лист для підтвердження зміни адреси.",
          },
    );
    if (!error) setNewEmail("");
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (password.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "Пароль має містити щонайменше 6 символів.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Паролі не співпадають.",
      });
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    setPasswordFeedback(
      error
        ? { type: "error", message: error.message }
        : { type: "success", message: "Пароль успішно змінено." },
    );
    if (!error) {
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <UserRound aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-1">
              <CardTitle>Профіль</CardTitle>
              <CardDescription>
                Ім’я відображається лише у вашому акаунті.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Ім’я</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                autoComplete="name"
                placeholder="Як до вас звертатися"
              />
            </div>
            {profileFeedback && <Feedback feedback={profileFeedback} />}
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зберегти профіль
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-1">
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Поточна адреса: <span className="font-medium text-foreground">{email}</span>.
                Після зміни підтвердіть нову адресу з листа.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">Нова адреса email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {emailFeedback && <Feedback feedback={emailFeedback} />}
            <Button type="submit" disabled={savingEmail}>
              {savingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Змінити email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 text-primary" />
            <div className="space-y-1">
              <CardTitle>Безпека</CardTitle>
              <CardDescription>
                Використовуйте пароль, який не застосовуєте на інших сайтах.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Новий пароль</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Повторіть новий пароль</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            {passwordFeedback && <Feedback feedback={passwordFeedback} />}
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Змінити пароль
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
